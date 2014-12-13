var graphs = new Array();

graphs[1] = ["% Graph 1: Graph mit 4 Knoten und Kanten ohne negative Gewichte",
    /*"n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",

    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",

    "e 0 1 4",
    "e 0 2 40",
    "e 0 3 18",
    "e 1 2 16",
    "e 1 3 4",
    "e 3 2 6"

    ,"e 30 31 60"
    ,"e 30 29 2"
    ,"e 29 31 6"
    ,"e 30 28 10"
    ,"e 30 26 15"

    ,"e 5 1 20"
    ,"e 5 25 5"
    ,"e 25 1 3"*/
    "n 100 250",
    "n 250 250",
    "n 400 250",
    "n 550 250",
    "n 325 100",
    "n 175 400",
    "n 325 400",
    "n 475 400",

    "e 1 0 13",
    "e 1 2 ?",
    "e 4 0 ?",
    "e 1 4 9",
    "e 4 1 ?",
    "e 2 4 ?",
    "e 4 3 ?",
    "e 2 3 10",
    "e 3 2 ?",
    "e 1 5 ?",
    "e 5 1 ?",
    "e 5 6 ?",
    "e 1 6 6",
    "e 3 7 8",
    "e 6 7 ?",
    "e 7 6 ?",
    "e 5 0 ?",
    "e 3 6 ?"
];

graphs[2] = ["% Graph 2: Graph mit 6 Knoten und positivem Kreis",
    "n 100 250",
    "n 200 250",
    "n 350 100",
    "n 350 400",
    "n 500 250",
    "n 600 250",
    "e 3 1 5",
    "e 1 2 10",
    "e 4 3 5",
    "e 2 4 7",
    "e 4 5 15",
    "e 0 1 10"
];

graphs[3] = ["% Graph 3: Großstädte Europas",
    "% Reihenfolge: London, Berlin, Madrid",
    "% Kiew, Rom, Paris, Minsk, Stockholm, Dublin, Wien",
    "n 217 221",
    "n 403 214",
    "n 118 460",
    "n 645 217",
    "n 402 449",
    "n 245 286",
    "n 580 154",
    "n 448 57",
    "n 146 174",
    "n 453 305",
    "e 0 5 343",
    "e 5 0 343",
    "e 1 6 954",
    "e 6 1 954",
    "e 1 5 879",
    "e 5 1 879",
    "e 2 5 1054",
    "e 5 2 1054",
    "e 2 4 1364",
    "e 4 2 1364",
    "e 3 6 433",
    "e 6 3 433",
    "e 4 5 1106",
    "e 5 4 1106",
    "e 8 0 464",
    "e 0 8 464",
    "e 7 1 811",
    "e 7 0 1435",
    "e 0 7 1435",
    "e 1 7 811",
    "e 6 7 837",
    "e 7 6 837",
    "e 9 4 766",
    "e 4 9 766",
    "e 9 3 1053",
    "e 3 9 1053",
    "e 9 1 524",
    "e 1 9 524"
];

graphs[4] = ["% Graph 1: Graph mit 4 Knoten und Kanten ohne negative Gewichte",
    /*"n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",

    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",
    "n 139 212",
    "n 266 94",
    "n 478 203",
    "n 273 285",

    "e 0 1 4",
    "e 0 2 40",
    "e 0 3 18",
    "e 1 2 16",
    "e 1 3 4",
    "e 3 2 6"

    ,"e 30 31 60"
    ,"e 30 29 2"
    ,"e 29 31 6"
    ,"e 30 28 10"
    ,"e 30 26 15"

    ,"e 5 1 20"
    ,"e 5 25 5"
    ,"e 25 1 3"*/
    "n 100 250",
    "n 250 250",
    "n 400 250",
    "n 550 250",
    "n 325 100",
    "n 175 400",
    "n 325 400",
    "n 475 400",

    "e 1 0 13",
    "e 1 2 3",
    "e 4 0 4",
    "e 1 4 9",
    "e 4 1 9",
    "e 2 4 5",
    "e 4 3 4",
    "e 2 3 10",
    "e 3 2 8",
    "e 1 5 2",
    "e 5 1 4",
    "e 5 6 3",
    "e 1 6 6",
    "e 3 7 8",
    "e 6 7 5",
    "e 7 6 1",
    "e 5 0 11",
    "e 3 6 2"
];

//graphs[2] = ["% Graph 2: Graph mit 6 Knoten und Kanten ohne negative Gewichte",
//"n 100 250",
//"n 266 100",
//"n 266 400",
//"n 433 100",
//"n 433 300",
//"n 600 250",
//"e 2 4 267",
//"e 3 5 317",
//"e 3 4 200",
//"e 4 5 217",
//"e 2 3 467",
//"e 1 4 367",
//"e 1 3 167",
//"e 0 2 316",
//"e 0 1 316"];

graphs[5] = ["% Graph 1: Graph mit 6 Knoten und Kanten ohne negative Gewichte",
"n 100 250",
"n 266 100",
"n 266 400",
"n 433 100",
"n 433 300",
"n 600 250",
"e 2 4 33",
"e 3 5 2",
"e 3 4 20",
"e 4 5 1",
"e 2 3 20",
"e 1 4 10",
"e 1 3 50",
"e 0 2 20",
"e 0 1 10"];

graphs[6] = ["% Graph 2: Graph mit 6 Knoten und positivem Kreis",
"n 100 250",
"n 200 250",
"n 350 100",
"n 350 400",
"n 500 250",
"n 600 250",
"e 3 1 5",
"e 1 2 10",
"e 4 3 5",
"e 2 4 7",
"e 4 5 15",
"e 0 1 10"];

graphs[7] = ["% Graph 2: Graph mit 6 Knoten und Kanten ohne negative Gewichte",
"n 150 250",
"n 300 250",
"n 225 150",
"n 225 350",
"n 450 150",
"n 450 350",
"e 0 1 9",
"e 0 2 3",
"e 2 1 5",
"e 1 2 4",
"e 0 3 4",
"e 3 1 2",
"e 2 4 6",
"e 4 5 7",
"e 5 3 8",
];