// Syllabus & Orientation data.
// Mindmap nodes are DERIVED from GEIN_DATA so they always stay in sync with
// the Resources and Specialisations pages (same French module titles & elements).
// Prerequisites are a logical pedagogical mapping; objectives are extracted
// verbatim from the official GEIN syllabus (Syllabus_GEIN.pdf).

import { GEIN_DATA } from "./gein-data";

export type SylCategory = "common" | "isnm" | "ise" | "isei";

export type SylNode = {
  id: string;            // e.g. "s1-M1", "s5_commun-C2", "isnm-O3"
  title: string;         // French module title (from GEIN_DATA)
  semester: "S1" | "S2" | "S3" | "S4" | "S5";
  col: number;           // 0..4
  row: number;
  category: SylCategory;
  elements: string[];    // sub-element names (from GEIN_DATA)
};

export type SylEdge = { from: string; to: string; type: "common" | "option" };

/* ------------------------------------------------------------------ */
/*  SEMESTER COLUMNS                                                   */
/* ------------------------------------------------------------------ */
export const SYL_SEMESTERS = [
  { id: "S1", label: "S1", sub: "1ère Année" },
  { id: "S2", label: "S2", sub: "1ère Année" },
  { id: "S3", label: "S3", sub: "2ème Année" },
  { id: "S4", label: "S4", sub: "2ème Année" },
  { id: "S5", label: "S5", sub: "3ème Année" },
] as const;

/* ------------------------------------------------------------------ */
/*  BUILD NODES FROM GEIN_DATA                                         */
/* ------------------------------------------------------------------ */
const SEM_KEY: Record<string, "S1" | "S2" | "S3" | "S4"> = {
  s1: "S1",
  s2: "S2",
  s3: "S3",
  s4: "S4",
};

function buildNodes(): SylNode[] {
  const nodes: SylNode[] = [];

  // S1 – S4 (common core)
  (["s1", "s2", "s3", "s4"] as const).forEach((key, col) => {
    GEIN_DATA[key].modules.forEach((m, i) => {
      nodes.push({
        id: `${key}-${m.id}`,
        title: m.title,
        semester: SEM_KEY[key],
        col,
        row: i,
        category: "common",
        elements: m.elements.map((e) => e.name),
      });
    });
  });

  // S5 — common core
  GEIN_DATA.s5_commun.modules.forEach((m, i) => {
    nodes.push({
      id: `s5_commun-${m.id}`,
      title: m.title,
      semester: "S5",
      col: 4,
      row: i,
      category: "common",
      elements: m.elements.map((e) => e.name),
    });
  });

  // S5 — options (each starts at row 3, below the 3 common modules)
  (["isnm", "ise", "isei"] as const).forEach((opt) => {
    GEIN_DATA[opt].modules.forEach((m, i) => {
      nodes.push({
        id: `${opt}-${m.id}`,
        title: m.title,
        semester: "S5",
        col: 4,
        row: 3 + i,
        category: opt,
        elements: m.elements.map((e) => e.name),
      });
    });
  });

  return nodes;
}

export const SYL_NODES: SylNode[] = buildNodes();

/* ------------------------------------------------------------------ */
/*  OPTION SELECTORS                                                   */
/* ------------------------------------------------------------------ */
export const SYL_OPTIONS = [
  { id: "isnm" as const, label: "ISNM" },
  { id: "ise" as const, label: "ISE" },
  { id: "isei" as const, label: "ISEI" },
];
export type SylOptionId = (typeof SYL_OPTIONS)[number]["id"];

/* ------------------------------------------------------------------ */
/*  PREREQUISITE MAP (nodeId -> prerequisite nodeIds)                  */
/* ------------------------------------------------------------------ */
export const SYL_PREREQS: Record<string, string[]> = {
  // S2 depends on S1
  "s2-M1": ["s1-M1", "s1-M7"], // Microcontrôleurs & FPGA
  "s2-M2": ["s1-M4"], // Machines Électriques
  "s2-M3": ["s1-M4"], // Installations BT
  "s2-M4": ["s1-M5"], // TNS
  "s2-M5": ["s1-M5"], // Commande
  "s2-M6": ["s1-M6"], // Langues 2
  // S3 depends on S1/S2
  "s3-M1": ["s2-M4"], // Communication Numérique
  "s3-M2": ["s1-M4", "s2-M2"], // Convertisseurs
  "s3-M3": ["s1-M1", "s2-M1"], // Réseaux Industriels
  "s3-M4": ["s2-M5"], // Espace d'État
  "s3-M5": ["s2-M1", "s2-M5"], // Projet & Stage 1
  "s3-M6": ["s2-M6"], // Langues Comm 1
  "s3-M7": ["s2-M4", "s1-M5"], // IA
  // S4 depends on S1-S3
  "s4-M1": ["s3-M2"], // Énergies & Smart Grids
  "s4-M2": ["s3-M4"], // Modélisation Multiphysique
  "s4-M3": ["s2-M4", "s2-M1"], // Traitement & Contrôle Embarqués
  "s4-M4": ["s2-M2", "s3-M2"], // Entraînement à Vitesse Variable
  "s4-M5": ["s3-M5"], // Dév. Technologique
  "s4-M7": ["s3-M6"], // Langues Comm 2
  // S5 commun
  "s5_commun-C2": ["s4-M6"], // Gestion de Projet
  "s5_commun-C3": ["s4-M7"], // Langues 3
  "s5_commun-C1": ["s4-M5"], // Gestion Indus & Stage 2
  // ISNM
  "isnm-O3": ["s4-M2", "s4-M5"], // Conception & Prototypage
  "isnm-O4": ["s3-M4"], // Commandes Avancées
  "isnm-O1": ["s4-M2", "s3-M4"], // Robotique
  "isnm-O2": ["s3-M3"], // Maintenance
  // ISE
  "ise-O1": ["s4-M3"], // Conception & Validation
  "ise-O2": ["s4-M3"], // Technologies Embarquées
  "ise-O4": ["s2-M1"], // OS & Temps Réel
  "ise-O3": ["s4-M3", "s3-M7"], // IoT
  // ISEI
  "isei-O2": ["s2-M3", "s4-M1"], // Conception Systèmes Électriques
  "isei-O4": ["s2-M3"], // Réseaux Électriques
  "isei-O3": ["s4-M1", "isei-O4"], // Audit & Efficacité
  "isei-O1": ["s3-M3"], // Maintenance
};

/* ------------------------------------------------------------------ */
/*  EDGES (derived from prereqs)                                       */
/* ------------------------------------------------------------------ */
export function buildEdges(visibleIds: Set<string>): SylEdge[] {
  const edges: SylEdge[] = [];
  for (const node of SYL_NODES) {
    if (!visibleIds.has(node.id)) continue;
    const prereqs = SYL_PREREQS[node.id];
    if (!prereqs) continue;
    for (const p of prereqs) {
      if (!visibleIds.has(p)) continue;
      edges.push({
        from: p,
        to: node.id,
        type: node.category === "common" ? "common" : "option",
      });
    }
  }
  return edges;
}

/* ------------------------------------------------------------------ */
/*  VISIBLE NODES for a given option (S1-S4 + commun + option)        */
/* ------------------------------------------------------------------ */
export function getVisibleNodes(option: SylOptionId): SylNode[] {
  return SYL_NODES.filter(
    (n) =>
      n.col < 4 ||
      n.category === "common" ||
      n.category === option
  );
}

/* ------------------------------------------------------------------ */
/*  PEDAGOGICAL OBJECTIVES (from Syllabus_GEIN.pdf, French verbatim)  */
/* ------------------------------------------------------------------ */
export const SYL_OBJECTIVES: Record<string, string[]> = {
  "s1-M7": [
    "Comprendre les principes de base de l'informatique.",
    "Maîtriser les fonctionnalités de base des principaux outils bureautiques (tableur, présentation, etc.).",
    "Manipuler des outils de communication et de travail collaboratif en ligne.",
    "Développer des programmes informatiques de base et maîtriser les concepts fondamentaux de la Programmation Orientée Objet (POO).",
    "Développer des applications C++ orientées objet.",
  ],
  "s1-M1": [
    "Doter les élèves ingénieurs des outils d'analyse et de synthèse des systèmes logiques combinatoires, séquentiels et programmables.",
    "Représenter un système automatisé par un GRAFCET.",
    "Programmer un Automate Programmable Industriel (API).",
  ],
  "s1-M2": [
    "Connaître les propriétés et les caractéristiques des composants et circuits élémentaires de l'électronique analogique.",
    "Maîtriser les méthodes et techniques de base pour l'étude et la synthèse des fonctions élémentaires (filtrage, génération de signaux, synthèse de fréquences) répondant à un cahier des charges.",
  ],
  "s1-M3": [
    "Initier les élèves ingénieurs aux techniques de dessin et de construction des mécanismes.",
    "Maîtriser les modélisations cinématiques (3D) et dynamique pour le prototypage virtuel des chaînes de transmission de puissance.",
  ],
  "s1-M4": [
    "Comprendre le comportement d'un composant passif ou à semi-conducteur dans le domaine de la commutation.",
    "Dimensionner ou choisir un composant passif ou actif pour une application en électronique de puissance.",
  ],
  "s1-M5": [
    "Doter les étudiants des compétences nécessaires pour comprendre, analyser et résoudre des problèmes complexes à l'aide des techniques de recherche opérationnelle et d'analyse numérique.",
  ],
  "s1-M6": [
    "Préparer les étudiants au niveau de Certification B1 et à la méthodologie de la dissertation.",
    "Approfondir la culture scientifique et technique et exploiter des documents multidisciplinaires.",
    "Academic English : parler couramment, rédiger essais et rapports, comprendre et synthétiser des textes.",
  ],
  "s2-M1": [
    "Fournir une base solide pour comprendre et développer des systèmes basés sur des microcontrôleurs dans des contextes industriels.",
    "Offrir une compréhension approfondie de la conception et de l'utilisation des FPGA en ingénierie électrique.",
    "Introduire l'utilisation d'outils avancés de modélisation de systèmes électroniques et d'implémentation sur FPGA.",
  ],
  "s2-M2": [
    "Comprendre la constitution et la structure de base des principales machines électriques utilisées en électrotechnique.",
    "Prédéterminer et exploiter les caractéristiques statiques des différentes machines électriques.",
    "Maîtriser l'emploi des paramètres modifiant le fonctionnement d'une machine électrique.",
  ],
  "s2-M3": [
    "Fournir une compréhension approfondie des normes, composants et méthodes de conception des installations basse tension.",
    "Développer les compétences pour dimensionner, mettre en œuvre et maintenir les installations de façon sécurisée.",
    "Mettre en application les normes de sécurité en vigueur sur les ouvrages et appareillages électroniques BT.",
  ],
  "s2-M4": [
    "Enseigner les méthodes et techniques de base du traitement numérique des signaux pour la conception de systèmes TNS.",
    "Étudier l'architecture des DSP et se familiariser avec leurs utilisations via des implémentations.",
    "Maîtriser les techniques de mesure du temps d'exécution et de calcul de performance sur DSP.",
  ],
  "s2-M5": [
    "Justifier les avantages de la commande en boucle fermée par rapport à la boucle ouverte.",
    "Quantifier les performances des systèmes linéaires asservis et synthétiser le correcteur répondant à un cahier des charges.",
    "Implémenter une loi de commande numérique.",
  ],
  "s2-M6": [
    "Consolider les compétences linguistiques vers le niveau B2.",
    "Explorer les mécanismes du débat culturel et de l'argumentation.",
  ],
  "s2-M7": [
    "Développer la sensibilité artistique et culturelle des étudiants ingénieurs.",
    "Analyser les courants et œuvres des arts visuels pour nourrir une créativité appliquée.",
  ],
  "s3-M1": [
    "Comprendre les modes de transmission des ondes en radiofréquences.",
    "Concevoir les éléments constitutifs de la couche physique d'un système de communication numérique, en vue d'une réception optimale.",
  ],
  "s3-M2": [
    "Acquérir une compréhension approfondie des principes de fonctionnement des convertisseurs statiques (AC-DC, DC-AC, DC-DC, AC-AC).",
    "Modéliser et simuler des convertisseurs à l'aide de logiciels spécialisés (MATLAB/Simulink, PSpice, PSim).",
    "Intégrer les convertisseurs dans des systèmes énergétiques intelligents (smart grids) avec gestion optimisée de l'énergie.",
  ],
  "s3-M3": [
    "Concevoir, dimensionner, installer et configurer des réseaux industriels de terrain pour la commande et le contrôle en temps réel.",
    "Mettre en service des réseaux industriels locaux et distants pour la supervision des équipements.",
  ],
  "s3-M4": [
    "Identifier le modèle dynamique d'un système selon les variables d'état.",
    "Mettre en œuvre une loi de commande et d'observation pour le contrôle et le pilotage des systèmes dynamiques.",
  ],
  "s3-M5": [
    "Réaliser un projet de développement technique en équipe.",
    "Effectuer un stage d'initiation en milieu industriel et en rendre compte.",
  ],
  "s3-M6": [
    "Préparer les étudiants au niveau de Certification B2.",
    "Exploiter les théories de communication dans des situations professionnelles.",
    "Public Speaking : concevoir et livrer des discours efficaces, maîtriser la communication non verbale.",
  ],
  "s3-M7": [
    "Comprendre les principes fondamentaux de l'IA.",
    "Concevoir et mettre en œuvre des applications d'IA dans l'industrie.",
  ],
  "s4-M1": [
    "Acquérir les concepts théoriques et pratiques de modélisation, caractérisation et commande des chaînes de sources renouvelables (Éolien, Solaire, Hydraulique).",
    "Comprendre l'évolution des réseaux électriques et les fondements des réseaux intelligents (smart grids).",
    "Acquérir des connaissances sur les micro-réseaux, l'intégration des énergies renouvelables et du stockage de l'énergie.",
  ],
  "s4-M2": [
    "Doter les élèves des connaissances pour la modélisation, l'analyse et la simulation systémique et énergétique par Bond Graph.",
    "Cultiver les aptitudes à la conception et au prototypage virtuel des systèmes multi-physiques.",
    "Maîtriser les outils d'identification paramétrique pour construire des modèles mathématiques des systèmes dynamiques.",
  ],
  "s4-M3": [
    "Approfondir les techniques d'optimisation des implémentations d'algorithmes de traitement de signal sur DSP (parallélisme, temps réel).",
    "Implémenter un programme de contrôle sur une unité électronique.",
  ],
  "s4-M4": [
    "Comprendre la constitution et la structure de base des principales machines électriques.",
    "Prédéterminer et exploiter les caractéristiques statiques des machines.",
    "Maîtriser les paramètres modifiant le fonctionnement d'une machine électrique et les variateurs industriels associés.",
  ],
  "s4-M5": [
    "Découvrir et analyser une problématique d'un secteur pluri-technique (électrique, électronique, mécatronique).",
    "Concevoir et réaliser le prototype d'un dispositif répondant à un cahier des charges.",
    "Développer des capacités d'analyse et de validation expérimentale d'une solution technique.",
  ],
  "s4-M6": [
    "Comprendre les fondamentaux de la gestion de projet et d'entreprise.",
    "Acquérir des compétences en économie, finance, marketing, contrôle de gestion et gestion de projets.",
    "Appliquer une démarche entrepreneuriale pour créer, gérer et faire croître une entreprise.",
  ],
  "s4-M7": [
    "Develop effective business writing and verbal communication skills.",
    "Improve listening, feedback and intercultural communication in business.",
    "PIP : préparer l'insertion professionnelle (CV, lettres, entretiens).",
  ],
  "s5_commun-C2": [
    "Comprendre les fondamentaux de la gestion de projet et d'entreprise.",
    "Acquérir des compétences en économie, finance, marketing, contrôle de gestion et gestion de projets.",
    "Appliquer une démarche entrepreneuriale pour créer, gérer et faire croître une entreprise.",
  ],
  "s5_commun-C3": [
    "Understand fundamental concepts of cultural and social anthropology to develop intercultural awareness.",
    "Analyze the impact of technology on contemporary culture and society.",
    "Explore the ethical implications of technological advancements.",
    "DALF C1 : optimiser les acquis linguistiques et s'entraîner aux épreuves de la certification.",
  ],
  "s5_commun-C1": [
    "Mettre en œuvre une solution technique dans le cadre d'un cahier des charges fourni par le tuteur industriel du stage.",
    "Maîtriser les méthodes et les outils de gestion industrielle dans une entreprise.",
  ],
  "isnm-O3": [
    "Dispenser les concepts, outils et pratiques pour la conception, simulation, animation et prototypage (virtuel et réel) des systèmes mécatroniques.",
  ],
  "isnm-O4": [
    "Montrer les différences fondamentales entre systèmes linéaires et non linéaires (multiplicité des points d'équilibre, cycles limites, sensibilité aux conditions initiales).",
    "Maîtriser les méthodes d'analyse, de contrôle et d'observation des systèmes non linéaires.",
    "Modéliser et commander un système par la logique floue et les réseaux de neurones.",
  ],
  "isnm-O1": [
    "Donner les concepts de base de la modélisation des robots industriels.",
    "Acquérir un savoir-faire sur la programmation des robots industriels (simulation + robot réel).",
    "S'intégrer efficacement dans l'industrie 4.0.",
  ],
  "isnm-O2": [
    "Maîtriser les méthodes d'organisation et d'application des stratégies de maintenance.",
    "Utiliser la GMAO (Gestion de Maintenance Assistée par Ordinateur).",
  ],
  "ise-O1": [
    "Concevoir les blocs d'un système embarqué selon des spécifications matérielles et logicielles.",
    "Acquérir les normes et technologies mises en œuvre dans les systèmes embarqués.",
    "Maîtriser les méthodes de vérification, validation et test des systèmes embarqués.",
  ],
  "ise-O2": [
    "Connaître les fondements de l'analyse des images et de la vidéo numérique.",
    "Maîtriser les méthodes de traitement d'images embarquées pour véhicules électriques : détection d'objets, surveillance de la route, reconnaissance de panneaux, fusion multicapteurs.",
    "Savoir dimensionner une chaîne de puissance d'un véhicule électrique et programmer des fonctions de signalisation.",
  ],
  "ise-O4": [
    "Analyser les contraintes temporelles d'un système de tâches.",
    "Programmer les fonctions de traitement d'un système temps réel à base de système d'exploitation embarqué.",
  ],
  "ise-O3": [
    "Fournir les outils pour la conception de systèmes intelligents et objets connectés.",
    "Intégrer les aspects théoriques et pratiques de l'IA et de l'IoT dans les systèmes embarqués.",
    "Maîtriser le traitement et l'analyse intelligents des données massives remontées par les capteurs.",
    "Concevoir des mécanismes de communication adaptés aux contraintes (énergie, calcul, mémoire).",
  ],
  "isei-O2": [
    "Comprendre les principes fondamentaux de la conception des systèmes électriques.",
    "Appliquer les normes et réglementations en vigueur.",
    "Développer des compétences en conception et simulation de systèmes électriques.",
    "Utiliser des logiciels de conception et de simulation, en équipe, pour répondre à un cahier des charges.",
  ],
  "isei-O4": [
    "Identifier et définir le rôle des éléments d'une installation électrique haute tension.",
    "Calculer canalisations et protections, choisir un régime du neutre et dimensionner un poste HTA/BT.",
    "Aborder la répartition de puissance et la coordination d'isolement des réseaux HT.",
    "Mettre en œuvre un logiciel industriel agréé pour dimensionner une installation HT.",
  ],
  "isei-O3": [
    "Approfondir les différentes sources d'énergies, leurs utilisations et impacts environnementaux.",
    "Établir un bilan des consommations dans les différents secteurs.",
    "Développer les critères d'optimisation des systèmes industriels et l'optimisation de l'utilisation de l'énergie dans le secteur industriel.",
  ],
  "isei-O1": [
    "Maîtriser les méthodes d'organisation et d'application des stratégies de maintenance.",
    "Utiliser la GMAO (Gestion de Maintenance Assistée par Ordinateur).",
  ],
};

/* ------------------------------------------------------------------ */
/*  META (credits / hours / nature) — from Syllabus_GEIN.pdf          */
/* ------------------------------------------------------------------ */
export const SYL_META: Record<
  string,
  { credits?: number; hours?: number; nature?: string }
> = {
  "s1-M7": { credits: 3, hours: 52, nature: "Power Skills" },
  "s1-M1": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s1-M2": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s1-M3": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s1-M4": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s1-M5": { credits: 4, hours: 52, nature: "Disciplinaire" },
  "s1-M6": { credits: 3, hours: 56, nature: "Langues étrangères" },
  "s2-M1": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s2-M2": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s2-M3": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s2-M4": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s2-M5": { credits: 4, hours: 52, nature: "Disciplinaire" },
  "s2-M6": { credits: 3, hours: 56, nature: "Langues étrangères" },
  "s2-M7": { credits: 3, hours: 52, nature: "Power Skills" },
  "s3-M1": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s3-M2": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s3-M3": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s3-M4": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s3-M5": { credits: 4, hours: 52, nature: "Disciplinaire" },
  "s3-M6": { credits: 3, hours: 56, nature: "Langues étrangères" },
  "s3-M7": { credits: 3, hours: 52, nature: "Power Skills" },
  "s4-M1": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s4-M2": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s4-M3": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s4-M4": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s4-M5": { credits: 4, hours: 52, nature: "Disciplinaire" },
  "s4-M6": { credits: 3, hours: 56, nature: "Power Skills" },
  "s4-M7": { credits: 3, hours: 56, nature: "Langues étrangères" },
  "s5_commun-C2": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "s5_commun-C3": { credits: 3, hours: 56, nature: "Langues étrangères" },
  "s5_commun-C1": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "isnm-O3": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "isnm-O4": { credits: 4, hours: 52, nature: "Disciplinaire" },
  "isnm-O1": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "isnm-O2": { credits: 4, hours: 52, nature: "Disciplinaire" },
  "ise-O1": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "ise-O2": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "ise-O4": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "ise-O3": { credits: 4, hours: 52, nature: "Disciplinaire" },
  "isei-O2": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "isei-O4": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "isei-O3": { credits: 5, hours: 52, nature: "Disciplinaire" },
  "isei-O1": { credits: 4, hours: 52, nature: "Disciplinaire" },
};

/* ------------------------------------------------------------------ */
/*  DETAIL-CARD FILTERS                                                */
/* ------------------------------------------------------------------ */
export const SYL_FILTERS = [
  { id: "all" as const, label: "Tous les Modules" },
  { id: "common" as const, label: "Tronc Commun" },
  { id: "isnm" as const, label: "ISNM" },
  { id: "ise" as const, label: "ISE" },
  { id: "isei" as const, label: "ISEI" },
];
export type SylFilterId = (typeof SYL_FILTERS)[number]["id"];

/* node color helper */
export const NODE_COLORS: Record<
  SylCategory,
  { color: string; glow: string }
> = {
  common: { color: "var(--accent)", glow: "var(--accent-glow)" },
  isnm: { color: "var(--cyan)", glow: "var(--cyan-glow)" },
  ise: { color: "var(--cyan)", glow: "var(--cyan-glow)" },
  isei: { color: "var(--cyan)", glow: "var(--cyan-glow)" },
};
