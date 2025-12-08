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
    { cx: 69,  cy: 91 },   // asse 1 DX
    { cx: 166, cy: 106 },  // asse 2 DX
  ],

  // lato sinistro (vista SX)
  sx: [
    { cx: 130, cy: 129 },  // asse 1 SX
    { cx: 253, cy: 113 },  // asse 2 SX
  ],
};


// ==============================
// 🚛 MOTRICE 2 ASSI
// ==============================
export const motrice2assi: WheelGeomEntry = {
  imageDX: "motrice2assiDX.png",
  imageSX: "motrice2assiSx.png",
  dx: [
    { cx: 202, cy: 141 },  // anteriore DX
    { cx: 41, cy: 123 },   // post esterna DX
    { cx: 40, cy: 121 },   // post interna DX
  ],
  sx: [
    { cx: 158, cy: 140 },  // anteriore SX
    { cx: 317, cy: 123 },  // post esterna SX
    { cx: 321, cy: 116 },  // post interna SX
  ],
};

// ==============================
// 🚛 MOTRICE 3 ASSI
// ==============================
export const motrice3assi: WheelGeomEntry = {
  imageDX: "motrice3assiDX.png",
  imageSX: "motrice3assiSX.png",
  dx: [
    { cx: 187, cy: 141 },  // anteriore
    { cx: 57, cy: 133 },   // 2° asse esterna
    { cx: 57, cy: 133 },   // 2° asse interna
    { cx: 24, cy: 128 },   // 3° asse
    { cx: 58, cy: 118 },   // 2° asse interna corretta
  ],
  sx: [
    { cx: 169, cy: 145 },  // anteriore
    { cx: 302, cy: 131 },  // 2° asse esterna
    { cx: 280, cy: 128 },  // 2° asse interna
    { cx: 335, cy: 127 },  // 3° asse
  ],
};

// ==============================
// 🚛 MOTRICE 4 ASSI
// ==============================
export const motrice4assi: WheelGeomEntry = {
  imageDX: "motrice4assiDX.png",
  imageSX: "motrice4assiSX.png",
  dx: [
    { cx: 250, cy: 140 }, // asse 1
    { cx: 173, cy: 128 }, // asse 2
    { cx: 81, cy: 110 },  // asse 3 ext
    { cx: 95, cy: 107 },  // asse 3 int
    { cx: 50, cy: 103 },  // asse 4 ext
    { cx: 64, cy: 92 },   // asse 4 int
  ],
  sx: [
    { cx: 109, cy: 143 }, // asse 1
    { cx: 184, cy: 128 }, // asse 2
    { cx: 279, cy: 108 }, // asse 3 ext
    { cx: 259, cy: 107 }, // asse 3 int
    { cx: 308, cy: 104 }, // asse 4 ext
    { cx: 292, cy: 98 },  // asse 4 int
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
    { cx: 67, cy: 149 },
    { cx: 40, cy: 145 },
    { cx: 23, cy: 142 },
  ],
  sx: [
    { cx: 289, cy: 149 },
    { cx: 316, cy: 146 },
    { cx: 335, cy: 143 },
  ],
};

// ==============================
// 🚛 CENTINA
// ==============================
export const centina: WheelGeomEntry = {
  imageDX: "centinaDX.png",
  imageSX: "centinaSX.png",
  dx: [
    { cx: 72, cy: 152 },
    { cx: 63, cy: 148 },
    { cx: 53, cy: 146 },
  ],
  sx: [
    { cx: 285, cy: 151 },
    { cx: 295, cy: 148 },
    { cx: 304, cy: 146 },
  ],
};

// ==============================
// 🚛 TRATTORE STRADALE (CISTERNA)
// ==============================
export const trattore: WheelGeomEntry = {
  imageDX: "trattore_cisternaDX.png",
  imageSX: "trattore_cisternaSX.png",
  dx: [
    { cx: 268, cy: 159 }, // ant dx
    { cx: 168, cy: 128 }, // post dx est
    { cx: 176, cy: 116 }, // post dx int
  ],
  sx: [
    { cx: 91, cy: 157 },  // ant sx
    { cx: 189, cy: 126 }, // post sx est
    { cx: 176, cy: 117 }, // post sx int
  ],
};

// ==============================
// 🚛 SEMIRIMORCHIO ASSI FISSI
// ==============================
export const semirimorchioFissi: WheelGeomEntry = {
  imageDX: "semirimorchioassefissoDX.png",
  imageSX: "semirimorchioassefissoSX.png",
  dx: [
    { cx: 177, cy: 134 },
    { cx: 128, cy: 134 },
    { cx: 73, cy: 137 },
  ],
  sx: [
    { cx: 178, cy: 134 },
    { cx: 230, cy: 134 },
    { cx: 286, cy: 136 },
  ],
};

// ==============================
// 🚛 SEMIRIMORCHIO ASSI STERZANTI
// ==============================
export const semirimorchioSterzante: WheelGeomEntry = {
  imageDX: "semirimorchioassesterzanteDX.png",
  imageSX: "semirimorchioassesterzanteSX.png",
  dx: [
    { cx: 177, cy: 134 },
    { cx: 128, cy: 134 },
    { cx: 73, cy: 137 },
  ],
  sx: [
    { cx: 178, cy: 134 },
    { cx: 230, cy: 134 },
    { cx: 286, cy: 136 },
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
