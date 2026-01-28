
/**
 * 
 * BoardCreator-klass som tar JSON-data och bygger spelbrädet
 * 
 */

export class BoardCreator {
    
    static createFromJSON(boardInstance, jsonData) {
        
        if (!jsonData) {
            console.error("BoardCreator: Ingen JSON-data skickades med!");
            return;
        }

        //Importera noder
        
        jsonData.nodes.forEach(node => {
            
            
            boardInstance.addNode(node.id, node.pos_x, node.pos_y, node.type);
        });

        //Importera kopplingar
        jsonData.edges.forEach(edge => {
            boardInstance.addEdge(edge.from, edge.to);
        });

        console.log(`Har laddat ${jsonData.nodes.length} noder!`);
    }
}