var questions = new Array();

questions[0] = {
    "question": "Welchen Distanzwert erhält Pfad (a, e)?",
    "answers" : [
        {
            "answer" : "3"
        },
        {
            "answer" : "6"
        },
        {
            "answer" : "9",
            "explanation" : "Der Knoten e kann von Knoten a über die Kanten (a, c) und (c, e) erreicht werden. Die Gesamtkost ist 3 + 6 = 9."
        }
    ],
    "correctAnswerIndex" : 2
};
questions[1] = {
    "question": "Welchen Distanzwert erhält Pfad (a, b)?",
    "answers" : [
        {
            "answer" : "4"
        },
        {
            "answer" : "6",
            "explanation" : "Der Knoten b kann von Knoten a über die Kanten (a, d) und (d, b) erreicht werden. Die Gesamtkost ist 2 + 4 = 6 bzw. billiger als derzeitige Kost 8."
        },
        {
            "answer" : "8"
        }
    ],
    "correctAnswerIndex" : 1
};

questions[2] = {
    "question": "Welchen Distanzwert erhält Pfad (b, a)?",
    "answers" : [
        {
            "answer" : "∞",
            "explanation" : "Der Knoten a kann nicht von Knoten b in diesem Graph erreicht werden."
        },
        {
            "answer" : "0"
        },
        {
            "answer" : "6"
        }
    ],
    "correctAnswerIndex" : 0
};

questions[3] = {
    "question": "Welchen Distanzwert erhält Pfad (b, f)?",
    "answers" : [
        {
            "answer" : "∞"
        },
        {
            "answer" : "7"
        },
        {
            "answer" : "17",
            "explanation" : "Der Knoten f kann von Knoten b über den Pfad (b, e), der aus Kanten (b, c) und (c, e) besteht, und über die Kante (e, f) erreicht werden."
        }
    ],
    "correctAnswerIndex" : 2
};

questions[4] = {
    "question": "Welchen Distanzwert erhält Pfad (a, b)?",
    "answers" : [
        {
            "answer" : "8",
            "explanation" : "Der Knoten b kann von Knoten a über die Kanten (a, c) und (c, b) erreicht werden. Die Gesamtkost ist 3 + 6 = 8 bzw. billiger als derzeitige Kost 9."
        },
        {
            "answer" : "5"
        },
        {
            "answer" : "3"
        }
    ],
    "correctAnswerIndex" : 0
};

questions[5] = {
    "question": "Welchen Distanzwert erhält Pfad (c, d)?",
    "answers" : [
        {
            "answer" : "8"
        },
        {
            "answer" : "13"
        },
        {
            "answer" : "21",
            "explanation" : "Der Knoten d kann von Knoten c über den Pfad (c, f), der aus Kanten (c, e) und (e, f) besteht, und über die Kante (f, d) erreicht werden. Die Gesamtkost ist 13 + 8 = 21."
        }
    ],
    "correctAnswerIndex" : 2
};

questions[6] = {
    "question": "Ist Knoten a von Knoten c erreichber?",
    "answers" : [
        {
            "answer" : "ja"
        },
        {
            "answer" : "nein",
            "explanation" : "Es gibt keine Kanten Menge, mit der man Knoten a von Knoten c erreichen kann."
        }
    ],
    "correctAnswerIndex" : 1
};