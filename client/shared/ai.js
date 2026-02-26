/**
 * BFS för att hitta kortaste avståndet
 * @param {Node} start = Startpunkten
 * @param {Node} goal = Målet
 * @param {Set} blocked = Noder som vi inte får gå tll
 */
function bfsDist(start, goal, blocked) {
    // börja med avstånd mål
    if (start === goal) return 0;
    
    const visited = new Set([start]); // håll koll på position så vi inte går i loopar
    const queue = [[start, 0]];      // Kö för noder att flytta till
    
    while (queue.length) {
        const [cur, d] = queue.shift(); // ta första noden i kön
        
        for (const n of cur.neighbors) { // kolla alla grannar
            if (visited.has(n)) continue; // ingen dubbelbesök!
            if (blocked.has(n) && n !== goal) continue; // blockad? gå inte dit!
            
            visited.add(n);
            if (n === goal) return d + 1; // mål hittad, totala steg
            queue.push([n, d + 1]);       // granne in i kön
        }
    }
    return Infinity; // infinity om vi inte kan nå målet
}

/**
 * BFS - returnera första noden i den kortaste vägen mot mål
 */
function bfsFirstStep(start, goal, blocked) {
    if (start === goal) return null;
    const visited = new Set([start]);
    const queue = [[start, null]];
    
    while (queue.length) {
        const [cur, first] = queue.shift();
        for (const n of cur.neighbors) {
            if (visited.has(n)) continue;
            if (blocked.has(n) && n !== goal) continue;
            
            visited.add(n);
            // Om 'first' är null... 'n' är den första steget
            const step = first ?? n; 
            if (n === goal) return step; // målet är nådd, ge första steget som togs dit
            queue.push([n, step]);
        }
    }
    return null;
}

/**
 * Flood-fill algoritm - hur många noder en spelare kan nå
 * se om AIn håller på att bli instängd
 */
function countReachable(start, blocked) {
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length) {
        const cur = queue.shift();
        for (const n of cur.neighbors) {
            if (!visited.has(n) && !blocked.has(n)) {
                visited.add(n);
                queue.push(n);
            }
        }
    }
    return visited.size; // totala tillgängliga noder
}

// ------------------------- Virus algoritmen --------------------------------

// Hitta alla giltiga drag för Virus
function simVirusMoves(body, bugSet, avSet) {
    const head = body[0];
    const bodySet = new Set(body);
    const tail = body[body.length - 1]; // om en bugg inte äts
    
    return head.neighbors.filter(n => {
        if (avSet.has(n)) return false; // gå inte på antivirus
        if (n === tail)   return true;
        if (bugSet.has(n)) return true; // ät buggar
        return !bodySet.has(n);         // gå inte på din egen svans!
    });
}

// Uppdatera efter ett Virusdrag
function simVirusMove(body, bugSet, move) {
    const newBugs = new Set(bugSet);
    let newBody;
    
    if (newBugs.has(move)) {
        // väx om vi äter bugg
        newBugs.delete(move);
        newBody = [move, ...body];
    } else {
        newBody = [move, ...body.slice(0, -1)];
    }
    return { body: newBody, bugSet: newBugs };
}

function simServerCount(body) {
    let c = 0;
    for (const n of body) if (n.isServer()) c++;
    return c;
}

// hur bra är positionen för virus?
function virusHeuristic(body, bugSet, avSet, allNodes) {
    const head    = body[0];
    const bodySet = new Set(body);
    const tail    = body[body.length - 1];
    const blocked = new Set([...bodySet, ...avSet]);
    blocked.delete(tail);

    const covered = simServerCount(body);
    if (covered >= 2) return 1_000_000; // Virus har vunnit

    const space = countReachable(head, blocked);
    if (space < body.length) return -500_000 + space; // Virus är instängd

    const servers = allNodes.filter(n => n.isServer() && !bodySet.has(n));
    const bugs    = [...bugSet];
    const len     = body.length;

    const nearSrvDist = servers.length
        ? Math.min(...servers.map(s => bfsDist(head, s, blocked)))
        : 0;
    const nearBugDist = bugs.length
        ? Math.min(...bugs.map(b => bfsDist(head, b, blocked)))
        : 30;

    // när virus är kort, gå till buggar, när den är lång, fokusera på servrar
    const bugWeight    = Math.max(0, 8 - len) * 12;
    const serverWeight = 20 + len * 3;

    return (
          len * 25
        + covered * 600
        - nearSrvDist * serverWeight
        - nearBugDist * bugWeight
        + Math.min(space, 20) * 1.5
    );
}


// ------------------------- AntiVirus algoritmen --------------------------------

function simAvMoves(avNode, avNodes, virusBody, bugSet) {
    const bodySet = new Set(virusBody);
    const tail    = virusBody[virusBody.length - 1];
    const otherAV = avNodes.find(n => n !== avNode); // håll koll på båda antivirus noderna
    
    return avNode.neighbors.filter(n => {
        if (n.isServer()) return false; // gå inte på server
        if (otherAV && n === otherAV) return false; // två antivirus får inte vara på sammanod
        const isEmpty = (!bodySet.has(n) || n === tail);
        const hasBug  = bugSet.has(n);
        return isEmpty || hasBug; // gå på tomma noder och buggar
    });
}

// hur bra är positionen för antivirus?
function avHeuristic(virusBody, bugSet, avNodes, allNodes) {
    const avSet   = new Set(avNodes);
    const bodySet = new Set(virusBody);
    const tail    = virusBody[virusBody.length - 1];
    const head    = virusBody[0];
    const blocked = new Set([...bodySet, ...avSet]);
    blocked.delete(tail);

    // virus kan inte röra sig, antivirus vinner
    const virusMoves = simVirusMoves(virusBody, bugSet, avSet);
    if (!virusMoves.length) return 1_000_000;

    if (simServerCount(virusBody) >= 2) return -1_000_000;

    const servers = allNodes.filter(n => n.isServer());
    const bugs    = [...bugSet];

    // metod 1: blockera virusets väg till server
    let serverBlockScore = 0;
    for (const server of servers) {
        // hur långt har virus till server
        const distNoAV   = bfsDist(head, server, new Set([...bodySet]));
        // hur långt till antivirus
        const distWithAV = bfsDist(head, server, blocked);

        // antivirus belönas om den gör vägen längre
        if (distWithAV > distNoAV + 1) serverBlockScore += 200;
        else if (distWithAV > distNoAV) serverBlockScore += 80;

        // bonus om antivirus är på kortaste vägen till server
        const stepToSrv = bfsFirstStep(head, server, new Set([...bodySet]));
        if (stepToSrv && avNodes.includes(stepToSrv)) serverBlockScore += 150;

        // ännu en bonus om antivirus är nära server
        for (const av of avNodes) {
            if (bfsDist(av, server, new Set()) <= 2) serverBlockScore += 60;
        }
    }

    // metod 2; flytta buggarna ifrån virus
    let bugScore = 0;
    for (const bug of bugs) {
        const bugDistToVirus = bfsDist(bug, head, new Set());
        if (bugDistToVirus <= 3) {
            for (const av of avNodes) {
                const avToBug = bfsDist(av, bug, new Set());
                // belön om man är nära en bugg som är nära ett virus
                bugScore += Math.max(0, 10 - avToBug) * (5 - bugDistToVirus) * 6;
            }
        }
        // extra bonus om antivirus faktiskt går till den buggen
        if (avNodes.includes(bug)) bugScore += 100;
    }

    // metod 3 (VIKTIGAST); stäng in viruset
    const space    = countReachable(head, blocked);
    const exits    = virusMoves.length;
    const trapScore = -space * 3 - exits * 10;

    // sprid ut antivirus för att täcka mer
    const spread = avNodes.length === 2
        ? Math.min(bfsDist(avNodes[0], avNodes[1], new Set()), 10) * 4
        : 0;

    return serverBlockScore + bugScore + trapScore + spread;
}

// -------------------- VIRUS KLASS -----------------------------

export class VirusAI {
    constructor() {
        // håll koll på vart man går för att inte gå i loop
        this.recentNodes = [];
    }

    // Minimax för Virus
    minimax(body, bugSet, avSet, allNodes, depth, alpha, beta) {
        // är vi på två servrar?
        const covered = simServerCount(body);
        if (covered >= 2) return 1_000_000 + depth * 1000; // poäng för snabb vinst

        // Hämta möjliga drag
        const moves = simVirusMoves(body, bugSet, avSet);
        if (!moves.length) return -500_000; // inga drag, då har vi förlorat
        
        // om vi har nått maxdjup så kollar hueteristics läget
        if (depth === 0)   return virusHeuristic(body, bugSet, avSet, allNodes);

        let best = -Infinity;
        for (const move of moves) {
            // nästa steg
            const { body: nb, bugSet: nb2 } = simVirusMove(body, bugSet, move);
            //gå djupare
            const score = this.minimax(nb, nb2, avSet, allNodes, depth - 1, alpha, beta);
            
            if (score > best) best = score;
            // Alpha-beta pruning
            alpha = Math.max(alpha, best);
            if (alpha >= beta) break; 
        }
        return best;
    }

    // virusets nästa steg
    pickMove(board) {
        const virus      = board.virus;
        const validMoves = virus.getValidMoves();
        if (!validMoves.length) return null;

        // data för steget
        const body     = virus.nodes;
        const bugSet   = new Set(board.bugs.nodes);
        const avSet    = new Set(board.antivirus.nodes);
        const allNodes = board.getAllNodes();

        let bestMove  = null;
        let bestScore = -Infinity;

        // loopa alla möjliga drag och kör minimax för att välja bästa
        for (const move of validMoves) {
            const { body: nb, bugSet: nb2 } = simVirusMove(body, bugSet, move);
            // kolla 4 drag fram, så djup 4
            let score = this.minimax(nb, nb2, avSet, allNodes, 4, -Infinity, Infinity);
            
            // minuspoäng om draget upprepas
            if (this.recentNodes.includes(move)) score -= 300;
            
            if (score > bestScore) { 
                bestScore = score; 
                bestMove = move; 
            }
        }

        // ha minne för de 6 senaste dragen
        if (bestMove) {
            this.recentNodes.push(bestMove);
            if (this.recentNodes.length > 6) this.recentNodes.shift();
        }
        return bestMove ?? validMoves[0];
    }
}

// --------------------- ANTIVIRUS KLASS -----------------------------------

export class AntivirusAI {
    constructor() {
        // håll koll på antivirus som senast flyttades
        this.lastMovedId = null;
    }

    /// Minimax för Antivirus
    minimax(virusBody, bugSet, avNodes, allNodes, depth, isAvTurn, alpha, beta) {
        const avSet = new Set(avNodes);
        const virusMoves = simVirusMoves(virusBody, bugSet, avSet);

        // Kolla villkoren för ett avslutat spel, förlust eller vinst
        if (!virusMoves.length)              return 1_000_000 + depth * 1000;
        if (simServerCount(virusBody) >= 2)  return -1_000_000;
        if (depth === 0) return avHeuristic(virusBody, bugSet, avNodes, allNodes);

        if (isAvTurn) {
            // Antivirus tur
            let best = -Infinity;
            let anyMoves = false;
            for (let i = 0; i < avNodes.length; i++) {
                const avNode = avNodes[i];
                const other  = avNodes[1 - i];
                const moves  = simAvMoves(avNode, avNodes, virusBody, bugSet);
                if (!moves.length) continue; 

                anyMoves = true;
                for (const move of moves) {
                    // uppdatera antivirus positioner
                    const newAV = i === 0 ? [move, other] : [avNodes[0], move];
                    const score = this.minimax(virusBody, bugSet, newAV, allNodes, depth - 1, false, alpha, beta);
                    if (score > best) best = score;
                    alpha = Math.max(alpha, best);
                    if (alpha >= beta) break;
                }
                if (alpha >= beta) break;
            }
            if (!anyMoves) return avHeuristic(virusBody, bugSet, avNodes, allNodes);
            return best;

        } else {
            // virusets tur
            let worst = Infinity;
            for (const move of virusMoves) {
                const { body: nb, bugSet: nb2 } = simVirusMove(virusBody, bugSet, move);
                const score = this.minimax(nb, nb2, avNodes, allNodes, depth - 1, true, alpha, beta);
                if (score < worst) worst = score;
                beta = Math.min(beta, worst);
                if (alpha >= beta) break;
            }
            return worst;
        }
    }

    // välj vilken antivirus nod som ska gå var
    pickMove(board) {
        const avNodes   = [...board.antivirus.nodes];
        const virusBody = board.virus.nodes;
        const bugSet    = new Set(board.bugs.nodes);
        const allNodes  = board.getAllNodes();

        let bestFrom  = null;
        let bestTo    = null;
        let bestScore = -Infinity;

        // Testa drag för båda antivirus noderna
        for (let i = 0; i < avNodes.length; i++) {
            const avNode = avNodes[i];
            const other  = avNodes[1 - i];
            
            // Hämta alla giltiga drag
            board.antivirus.selectedNode = avNode;
            const moves = board.antivirus.getValidMoves(board);
            board.antivirus.selectedNode = null;

            for (const move of moves) {
                const newAV = i === 0 ? [move, other] : [avNodes[0], move];
                // kolla 3 steg fram, så djup 3
                let score = this.minimax(virusBody, bugSet, newAV, allNodes, 3, false, -Infinity, Infinity);

                // ain får inte flytta samma antvirus nod för ofta!
                if (avNode.id === this.lastMovedId) score -= 80;

                if (score > bestScore) {
                    bestScore = score;
                    bestFrom  = avNode;
                    bestTo    = move;
                }
            }
        }

        // fallback för om inget bra drag hittas, bara välj en laglig drag så länge
        if (!bestFrom) {
            for (const avNode of avNodes) {
                board.antivirus.selectedNode = avNode;
                const moves = board.antivirus.getValidMoves(board);
                board.antivirus.selectedNode = null;
                if (moves.length) {
                    this.lastMovedId = avNode.id;
                    return { from: avNode, to: moves[Math.floor(Math.random() * moves.length)] };
                }
            }
            return null;
        }

        // Spara antivirus node som flyttades inför nästa tur
        this.lastMovedId = bestFrom.id;
        return { from: bestFrom, to: bestTo };
    }
}