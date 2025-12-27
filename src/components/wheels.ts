// wheels.ts
// Mappatura completa gomme per tutte le categorie mezzo

export interface WheelPoint {
  cx: number;
  cy: number;
}

export interface WheelGeomEntry {
  imageDX: string;
  imageSX: string;
  dx: WheelPoint[];
  sx: WheelPoint[];
}

// ==============================
// 🚛 BIGA
// ==============================
// ==============================
// 🚛 BIGA
// ==============================
export const biga: WheelGeomEntry = {
  imageDX: "bigaDX.png",
  imageSX: "bigaSX.png",

  // lato destro (vista DX)
  dx: [
    { cx: 87.47288167110891, cy: 144.63150065083988 },   // asse 1 DX
    { cx: 118.17764829851856, cy: 147.48775801152917 },  // asse 2 DX
  ],

  // lato sinistro (vista SX)
  sx: [
    { cx: 243.13890782867415, cy: 148.9158866918738 },  // asse 1 SX
    { cx: 273.8436744560838, cy: 143.91743631066757 },  // asse 2 SX
  ],
};


// ==============================
// 🚛 MOTRICE 2 ASSI
// ==============================
export const motrice2assi: WheelGeomEntry = {
  imageDX: "motrice2assiDX.png",
  imageSX: "motrice2assiSx.png",
  dx: [
    { cx: 258.1342589722928, cy: 138.91898592946134 },  // anteriore DX
    { cx: 88.90101035145354, cy: 131.06427818756586 },   // post esterna DX
    { cx: 86.04475299076427, cy: 141.77524329015063 },   // post interna DX
  ],
  sx: [
    { cx: 103.1822971548999, cy: 138.20492158928903 },  // anteriore SX
    { cx: 273.8436744560838, cy: 137.49085724911671 },  // post esterna SX
    { cx: 273.1296101159115, cy: 131.06427818756586 },  // post interna SX
  ],
};

// ==============================
// 🚛 MOTRICE 3 ASSI
// ==============================
export const motrice3assi: WheelGeomEntry = {
  imageDX: "motrice3assiDX.png",
  imageSX: "motrice3assiSX.png",
  dx: [
    { cx: 267.41709539453296, cy: 127.85098865679043 },  // anteriore
    { cx: 146.74022190541126, cy: 127.1369243166181 },   // 2° asse esterna
    { cx: 146.02615756523895, cy: 137.8478894192029 },   // 2° asse interna
    { cx: 116.0354552780016, cy: 128.56505299696275 },   // 3° asse
  ],
  sx: [
    { cx: 93.89946073265976, cy: 127.1369243166181 },  // anteriore
    { cx: 216.00446290212608, cy: 137.13382507903057 },  // 2° asse esterna
    { cx: 213.86226988160914, cy: 126.42285997644579 },  // 2° asse interna
    { cx: 247.42329386970806, cy: 129.27911733713506 },  // 3° asse
  ],
};

// ==============================
// 🚛 MOTRICE 4 ASSI
// ==============================
export const motrice4assi: WheelGeomEntry = {
  imageDX: "motrice4assiDX.png",
  imageSX: "motrice4assiSX.png",
  dx: [
    { cx: 265.98896671418834, cy: 128.20802082687658 }, // asse 1
    { cx: 163.16370172937457, cy: 128.20802082687658 }, // asse 2
    { cx: 124.60422736006942, cy: 135.34866422859977 },  // asse 3 ext
    { cx: 130.31674208144796, cy: 120.3533130849811 },  // asse 3 int
    { cx: 92.47133205231513, cy: 132.4924068679105 },  // asse 4 ext
    { cx: 94.61352507283209, cy: 118.92518440463645 },   // asse 4 int
  ],
  sx: [
    { cx: 95.3275894130044, cy: 128.20802082687658 }, // asse 1
    { cx: 196.7247257174735, cy: 125.35176346618732 }, // asse 2
    { cx: 231.71387838591707, cy: 133.92053554825512 }, // asse 3 ext
    { cx: 230.99981404574476, cy: 118.92518440463645 }, // asse 3 int
    { cx: 268.8452240748776, cy: 133.2064712080828 }, // asse 4 ext
    { cx: 265.98896671418834, cy: 115.35486270377487 },  // asse 4 int
  ],
};

// ==============================
// 🚛 PIANALE
// ==============================
export const pianale: WheelGeomEntry = {
  imageDX: "pianaleDX.png",
  imageSX: "pianaleSX.png",
  dx: [
    { cx: 48, cy: 134 },
    { cx: 32, cy: 131 },
    { cx: 20, cy: 128 },
  ],
  sx: [
    { cx: 311, cy: 134 },
    { cx: 325, cy: 131 },
    { cx: 339, cy: 128 },
  ],
};

// ==============================
// 🚛 VASCA
// ==============================
export const vasca: WheelGeomEntry = {
  imageDX: "vascaDX.png",
  imageSX: "vascaSX.png",
  dx: [
    { cx: 101.04010413438294, cy: 151.4151118824769 },
    { cx: 78.19004524886878, cy: 148.55885452178765 },
    { cx: 58.9103080642162, cy: 145.70259716109837 },
  ],
  sx: [
    { cx: 262.41864501332674, cy: 151.4151118824769 },
    { cx: 284.55463955866855, cy: 149.27291886195997 },
    { cx: 303.12031240314883, cy: 147.8447901816153 },
  ],
};

// ==============================
// 🚛 CENTINA
// ==============================
export const centina: WheelGeomEntry = {
  imageDX: "centinaDX.png",
  imageSX: "centinaSX.png",
  dx: [
    { cx: 128.174549060931, cy: 132.13537469782435 },
    { cx: 106.75261885576148, cy: 131.421310357652 },
    { cx: 86.7588173309366, cy: 129.27911733713506 },
  ],
  sx: [
    { cx: 235.99826442695098, cy: 131.421310357652 },
    { cx: 255.27800161160354, cy: 127.85098865679043 },
    { cx: 275.27180313642845, cy: 127.1369243166181 },
  ],
};

// ==============================
// 🚛 TRATTORE STRADALE (CISTERNA)
// ==============================
export const trattore: WheelGeomEntry = {
  imageDX: "trattore_cisternaDX.png",
  imageSX: "trattore_cisternaSX.png",
  dx: [
    { cx: 176.0168598524763, cy: 153.91433707308002 }, // ant dx
    { cx: 84.61662431041964, cy: 144.63150065083988 }, // post dx est
    { cx: 101.75416847455526, cy: 138.91898592946134 }, // post dx int
  ],
  sx: [
    { cx: 186.72782495506107, cy: 151.05807971239076 },  // ant sx
    { cx: 273.1296101159115, cy: 146.77369367135685 }, // post sx est
    { cx: 261.7045806731544, cy: 139.63305026963366 }, // post sx int
  ],
};

// ==============================
// 🚛 SEMIRIMORCHIO ASSI FISSI
// ==============================
export const semirimorchioFissi: WheelGeomEntry = {
  imageDX: "semirimorchioassefissoDX.png",
  imageSX: "semirimorchioassefissoSX.png",
  dx: [
    { cx: 183.15750325419947, cy: 134.2775677183413 },
    { cx: 142.45583586437738, cy: 137.13382507903057 },
    { cx: 102.46823281472757, cy: 138.5619537593752 },
  ],
  sx: [
    { cx: 178, cy: 134 },
    { cx: 218.14665592264302, cy: 136.41976073885823 },
    { cx: 258.84832331246514, cy: 137.8478894192029 },
  ],
};

// ==============================
// 🚛 SEMIRIMORCHIO ASSI STERZANTI
// ==============================
export const semirimorchioSterzante: WheelGeomEntry = {
  imageDX: "semirimorchioassesterzanteDX.png",
  imageSX: "semirimorchioassesterzanteSX.png",
  dx: [
    { cx: 181.72937457385484, cy: 134.2775677183413 },
    { cx: 142.45583586437738, cy: 137.8478894192029 },
    { cx: 102.46823281472757, cy: 138.5619537593752 },
  ],
  sx: [
    { cx: 178, cy: 134 },
    { cx: 218.14665592264302, cy: 134.9916320585136 },
    { cx: 259.5623876526374, cy: 137.8478894192029 },
  ],
};

// ==============================
// 📌 EXPORT MAPPA COMPLETA
// ==============================
export const wheelGeom = {
  biga,
  motrice2assi,
  motrice3assi,
  motrice4assi,
  pianale,
  vasca,
  centina,
  trattore,
  semirimorchioFissi,
  semirimorchioSterzante,
};
