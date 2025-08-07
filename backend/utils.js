const namesForLetters = {
    "A": "de Atleet",
    "B": "het Beest",
    "C": "de Champion",
    "D": "de Dominator",
    "E": "Explosief",
    "F": "Flex",
    "G": "Gains",
    "H": "de Hulk",
    "I": "Iron",
    "J": "de Juggernaut",
    "K": "Kracht",
    "L": "de Liftkoning",
    "M": "de Machine",
    "N": "de Natural",
    "O": "Oerkracht",
    "P": "Pump",
    "Q": "Quads",
    "R": "Ripped",
    "S": "Sterk",
    "T": "de Tank",
    "U": "Ultimate",
    "V": "Vorm",
    "W": "de Wrecker",
    "X": "Xtreme",
    "Y": "de Yeti",
    "Z": "de Zwoeger"
}

const randomNumber = () => {
    return Math.floor(Math.random() * 1000);
}

export const generateNickname = (name) => {
    const firstLetter = name.charAt(0).toUpperCase();
    return `${name} ${namesForLetters[firstLetter]} ${randomNumber()}` || "de Onbekende";
}