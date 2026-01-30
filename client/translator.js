export class Translator {

    static language = "sv"; // sv = svenska, en = engelska, da = danska, no = norska, fi = finska, zh = kinesiska


    // NU laddas det in
    static dictionary = {
//        "startbutton": {
//            sv: "Spela",
//            zh: "Balala"
//        }
    }
    

    static async setText() {
        try {
            const response = await fetch("./test.json");
            const data = await response.json();

            Translator.dictionary = data;

            console.log("Language file loaded:", Translator.dictionary);
        } catch (err) {
            console.error("Failed to load language file:", err);
        }
    }

    static init = async () => {
        await Translator.setText();
    }




    // Placeholdernodes.keys, iterera genom dem för att replacea placeholders

    static getText(key) {
        return Translator.dictionary[key][Translator.language];
    }


    


}
