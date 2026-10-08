// GEIN academic data — module titles & sub-elements remain in French.
// UI strings live alongside in English. Drive / YouTube / Discord links are
// placeholders ("#") to be filled in later.

export type GEINElement = {
  name: string;
  drive: string;
  yt: string;
};

export type GEINModule = {
  id: string;
  title: string;
  elements: GEINElement[];
};

export type GEINLinkItem = { name: string; url: string };
export type GEINLink = {
  type: "dropdown";
  name: string;
  icon: "discord" | "whatsapp" | "youtube";
  items: GEINLinkItem[];
};

export type GEINSemester = {
  title: string;
  subtitle: string;
  links?: GEINLink[];
  modules: GEINModule[];
};

export const GEIN_DATA: Record<string, GEINSemester> = {
  s1: {
    title: "Semestre 1",
    subtitle: "Tronc Commun • 1ère Année",
    links: [
      {
        type: "dropdown",
        name: "Discord 1A",
        icon: "discord",
        items: [
          { name: "Promo 2028", url: "https://discord.gg/GsAfxsjWg" },
          { name: "Promo 2027", url: "https://discord.gg/S5FRQwGYK" },
        ],
      },
    ],
    modules: [
      {
        id: "M1",
        title: "Systèmes Automatisés",
        elements: [
          { name: "Circuits et Systèmes numériques", drive: "https://drive.google.com/drive/folders/1WvEnK776xuiTHHTX4CY4Lq80IfCvWytl", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbGLWsH6ZwsiZcruhY_crFj2" },
          { name: "Architecture et Programmation de systèmes automatisés", drive: "https://drive.google.com/drive/folders/1KQkBLkZlVyCObmEOAuGcY8LU_DpM77qZ", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbGFjOMNaCxp5pTlMDQIWmG0" },
        ],
      },
      {
        id: "M2",
        title: "Électronique Analogique",
        elements: [
          { name: "Composants et circuits électroniques", drive: "https://drive.google.com/drive/folders/1Tb6OwYJqOd26rUzqIRAwPZoGHBMdUc_F", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbGmtLLLeqHadDmL7uWGtTVa" },
          { name: "Fonctions électroniques", drive: "https://drive.google.com/drive/folders/1jId_GF8Bx0PP9BKQF5OjHFOORflSniqV", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbHBUZhgAxwatunRC-Q81Z_l" },
        ],
      },
      {
        id: "M3",
        title: "Technologies des Systèmes Mécaniques",
        elements: [
          { name: "Technologies et CAO mécaniques", drive: "https://drive.google.com/drive/folders/1cYSsQT1dzgFAhAWHpSbFAXERXYkQeQMQ", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbFKmjOM_Rv8GC32O8ttAxEF" },
          { name: "Modélisation et analyse fonctionnelle", drive: "https://drive.google.com/drive/folders/1TF3CM3NDlXJytPdheM_MrBJbH17xzO_m", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbEQpweiSiyi9gJlaatX6elA" },
        ],
      },
      {
        id: "M4",
        title: "Bases de l'Électrotechnique et de l'Électronique de Puissance",
        elements: [
          { name: "Bases de l'électrotechnique", drive: "https://drive.google.com/drive/folders/10gUu99g87Fz0Ylh75gTfbOS8ae49Zgvj", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbFomEjnlKQlgZrnnNpgUTO3" },
          { name: "Composants de l'Électronique de puissance", drive: "https://drive.google.com/drive/folders/1b3_QgasY40x5jzqmR5_cfWTPet5XyyC7", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbGEV5iIc6FPkqT52BP2YxYQ" },
        ],
      },
      {
        id: "M5",
        title: "Mathématiques pour l'Ingénieur",
        elements: [
          { name: "Recherche opérationnelle", drive: "https://drive.google.com/drive/folders/1qkkBXd7bVq8hxCF87aKZQu8Uzcc97WFe", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbFgFtnNwWW59zNdZm47-CXO" },
          { name: "Analyse numérique", drive: "https://drive.google.com/drive/folders/1cSMvvOIzGhMN7i1VFjmAsIAJZZFfbTCQ", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbG1wvrxZJhTG6ZN-_sBucg_" },
        ],
      },
      {
        id: "M6",
        title: "Langues et Cultures 1",
        elements: [
          { name: "Initiation aux Ateliers dissertatifs", drive: "https://drive.google.com/drive/folders/1tx5D8CenrJwp_21PEfdJjbr8QuXgCdzy", yt: "#" },
          { name: "Academic English 1", drive: "https://drive.google.com/drive/folders/1cVv-R-XfFYBLRDZj72aJJnzWdzbjd2aR", yt: "#" },
        ],
      },
      {
        id: "M7",
        title: "Compétences Digitales et Informatiques",
        elements: [
          { name: "Les bases de l'informatique", drive: "https://drive.google.com/drive/folders/1_lhtvcyx_-fSJgR6qZ8ClQEVR8YUlcou", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbE1IiLQN3gLaq0taDMED9le" },
          { name: "Programmation Orientée Objet", drive: "https://drive.google.com/drive/folders/1jXucR5UDWooOO29vuVBtsdE52uX9u6Nj", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbFg2H-Ru6ldKzOORY7Ttdm6" },
        ],
      },
    ],
  },
  s2: {
    title: "Semestre 2",
    subtitle: "Tronc Commun • 1ère Année",
    links: [
      {
        type: "dropdown",
        name: "Discord 1A",
        icon: "discord",
        items: [
          { name: "Promo 2028", url: "https://discord.gg/GsAfxsjWg" },
          { name: "Promo 2027", url: "https://discord.gg/S5FRQwGYK" },
        ],
      },
    ],
    modules: [
      {
        id: "M1",
        title: "Microcontrôleurs et Synthèse sur FPGA",
        elements: [
          { name: "Microcontrôleurs", drive: "https://drive.google.com/drive/folders/1NcuSFOsrQmtrP2_mWnpaGaJEpqLTYezH", yt: "#" },
          { name: "Synthèse sur FPGA", drive: "https://drive.google.com/drive/folders/1wSq1KZBgx9e-JGArU69GzIjEjG5bJHpF", yt: "#" },
        ],
      },
      {
        id: "M2",
        title: "Machines Électriques en Régime Permanent",
        elements: [
          { name: "Transformateurs et machines à courant continu", drive: "https://drive.google.com/drive/folders/1NSjENFVuTF1Bn7B_tacF4zCwOgGkvI2U", yt: "#" },
          { name: "Machines asynchrones et machines synchrones", drive: "https://drive.google.com/drive/folders/1oVEy4INi1pVxLjt0rR7j_ce1m5OuEgDD", yt: "#" },
        ],
      },
      {
        id: "M3",
        title: "Installations Électriques BT",
        elements: [
          { name: "Distribution et dispositifs de protection électrique", drive: "https://drive.google.com/drive/folders/1Upwee6EI-LkjKkMWZFykgZQIFPjNDzlQ", yt: "#" },
          { name: "Sécurité et Habilitation électrique", drive: "https://drive.google.com/drive/folders/1vnh3GbVBrxpD7Gn_ivKpYE73FUAV5vVT", yt: "#" },
        ],
      },
      {
        id: "M4",
        title: "Traitement Numérique du Signal et Implémentation sur DSP",
        elements: [
          { name: "Traitement numérique du signal", drive: "https://drive.google.com/drive/folders/1bnFXZuWYO2pmvYo-avmh9VR-YQOmq8wH", yt: "#" },
          { name: "Implémentation sur DSP", drive: "https://drive.google.com/drive/folders/1930id3hpngnXLCymBJwrSI-HeAELvSAq", yt: "#" },
        ],
      },
      {
        id: "M5",
        title: "Commande des Systèmes Dynamiques",
        elements: [
          { name: "Commandes linéaires continues", drive: "https://drive.google.com/drive/folders/19j8BYRblXbcl8I8CuQ2tZSYPcuWJKWZR", yt: "#" },
          { name: "Commandes linéaires discrètes", drive: "https://drive.google.com/drive/folders/19iXNqaxN1NF90Zvws1HYxXlmh7adWF9Z", yt: "#" },
        ],
      },
      {
        id: "M6",
        title: "Langues et Culture 2",
        elements: [
          { name: "Academic English 2", drive: "https://drive.google.com/drive/folders/1XtLdX94lupRKxQqf8CPw2VQkaJebkHPV", yt: "#" },
          { name: "Mécanismes du débat culturel", drive: "https://drive.google.com/drive/folders/1TEjpmofN9quvrJaQj9n2mhM5V8attOKL", yt: "#" },
        ],
      },
      {
        id: "M7",
        title: "Culture et Arts Visuels",
        elements: [
          { name: "Culture", drive: "https://drive.google.com/drive/folders/16Pt0KkFvR8F4_yZjjz3aeVluyxU9PmYL", yt: "#" },
          { name: "Arts visuels", drive: "https://drive.google.com/drive/folders/15llzWKGTjr_5Mq5EVZKe-3zxfaojhu8A", yt: "#" },
        ],
      },
    ],
  },
  s3: {
    title: "Semestre 3",
    subtitle: "Tronc Commun • 2ème Année",
    links: [
      {
        type: "dropdown",
        name: "Discord 2A",
        icon: "discord",
        items: [
          { name: "Promo 2028", url: "https://discord.gg/D8THWaMNy" },
          { name: "Promo 2027", url: "https://discord.gg/Wq3hHy9aC" },
        ],
      },
    ],
    modules: [
      {
        id: "M1",
        title: "Supports et Systèmes de Communication Numériques",
        elements: [
          { name: "Supports de transmission", drive: "https://drive.google.com/drive/folders/1v9wAwSDObhQlEwNPHGV28cG14K-OxQFY", yt: "#" },
          { name: "Systèmes de communication numériques", drive: "https://drive.google.com/drive/folders/1FeCM0Ot2GwdwhiE47fqq3-fSq8m3Ou2Q", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbE0-Dv_BTFkGxy4lQiJZk93" },
        ],
      },
      {
        id: "M2",
        title: "Convertisseurs Statiques de Puissance",
        elements: [
          { name: "Convertisseurs AC/DC et DC/DC", drive: "https://drive.google.com/drive/folders/1-lw8GXiKPe579nWpO5djUZR3hRE73wkm", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbFB3WXGfVLl6NjQsChHknZP" },
          { name: "Convertisseurs DC/AC", drive: "https://drive.google.com/drive/folders/1091G49lFJeCa4t7ERINIbzTGzu0Hrgrn", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbEJV6XTUGZAZLlHrgk3bn7z" },
        ],
      },
      {
        id: "M3",
        title: "Réseaux Industriels",
        elements: [
          { name: "Réseaux industriels de Contrôle/Commande", drive: "https://drive.google.com/drive/folders/1pdvEgO0nQJB0OKMP5BlUo0lLUDdEdGQ7", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbGP16_y-2aR4kJLzqxYA6n_" },
          { name: "Réseaux industriels de Supervision", drive: "https://drive.google.com/drive/folders/1lSAOkiumIn9OJ_buFj2VcfB-LWyaqogx", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbGdKUw04OHRdoIBA_htkjU2" },
        ],
      },
      {
        id: "M4",
        title: "Commande et Observation dans l'Espace d'État",
        elements: [
          { name: "Représentation d'état continue et discrète", drive: "https://drive.google.com/drive/folders/13jSxFXLem6xLmqcRdAGyEBDh9pHw0ZY6", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbHaglxPtjjvt8pGtSWModBZ" },
          { name: "Commande et observation dans l'espace d'état", drive: "https://drive.google.com/drive/folders/1dSZ1zmYqbudrHIrDxMgvty9eier5raPR", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbFHkOm_gnZA5WvpANuoqe84" },
        ],
      },
      {
        id: "M5",
        title: "Projet de Développement et Stage 1",
        elements: [
          { name: "Projet de développement", drive: "https://drive.google.com/drive/folders/1N3iBRcQsQnUOmSJLtyXDNAJq61yMoHx0", yt: "#" },
          { name: "Stage 1", drive: "https://drive.google.com/drive/folders/1pBHSu0oXujcx2AZwIZel4u5W21DFbGdJ", yt: "#" },
        ],
      },
      {
        id: "M6",
        title: "Langues et Communication 1",
        elements: [
          { name: "Théories de la communication", drive: "https://drive.google.com/drive/folders/1XQygmRY_aoqM_JCr6Uc5NKvLzmPVWACf", yt: "#" },
          { name: "Public Speaking", drive: "https://drive.google.com/drive/folders/1oaucDNJm0hPBPshPdlj2mjWo5eyQCYep", yt: "#" },
        ],
      },
      {
        id: "M7",
        title: "Intelligence Artificielle",
        elements: [
          { name: "Techniques d'IA", drive: "https://drive.google.com/drive/folders/11u0M-qOs12u-ArFqDyjIGGMYT-5PEZn3", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbEke8Jx3UTFkwU_v-HvS70f" },
          { name: "Apprentissage profond et IA générative", drive: "https://drive.google.com/drive/folders/1jDIbwzTtNlg0zy0q1qiQuy7G8xb-6XTp", yt: "#" },
        ],
      },
    ],
  },
  s4: {
    title: "Semestre 4",
    subtitle: "Tronc Commun • 2ème Année",
    links: [
      {
        type: "dropdown",
        name: "Discord 2A",
        icon: "discord",
        items: [
          { name: "Promo 2028", url: "https://discord.gg/D8THWaMNy" },
          { name: "Promo 2027", url: "https://discord.gg/Wq3hHy9aC" },
        ],
      },
    ],
    modules: [
      {
        id: "M1",
        title: "Énergies Renouvelables et Smart Grids",
        elements: [
          { name: "Énergies renouvelables", drive: "https://drive.google.com/drive/folders/1svqq8jDCd5h3JNomepKUB0ZtFR_HHbV4", yt: "#" },
          { name: "Smart grids", drive: "https://drive.google.com/drive/folders/1ekV4EfZkRiiALrFcqArbFBqm2EkD1JVT", yt: "#" },
        ],
      },
      {
        id: "M2",
        title: "Modélisation Multiphysique et Identification des Systèmes Dynamiques",
        elements: [
          { name: "Modélisation BondGraph et simulation des systèmes multi-physiques", drive: "https://drive.google.com/drive/folders/1BcjeNXDWLC3dbmcRSV9Z9OnlCblA8_1u", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbEPTgqZXEKcz6A32Kv7QPC2" },
          { name: "Identification paramétrique des systèmes dynamiques", drive: "https://drive.google.com/drive/folders/1eyLsPMYXVmvxGQZNRkuA0wliSjxwhD8T", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbHSs919HmVXVSnLMiQzqem5" },
        ],
      },
      {
        id: "M3",
        title: "Traitement et Contrôle Embarqués",
        elements: [
          { name: "Traitement embarqué de signal", drive: "https://drive.google.com/drive/folders/1VenhhTQOv6tPR6PqKNpzm8xZas0qInzI", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbGa9aGLOhvNuyL42rnA-rHJ" },
          { name: "Contrôle embarqué", drive: "https://drive.google.com/drive/folders/14R9HOcVZtDK4_6EePNuA0hnrn-xzB8ly", yt: "#" },
        ],
      },
      {
        id: "M4",
        title: "Entraînement à Vitesse Variable des Machines Électriques",
        elements: [
          { name: "Variation de vitesse des machines électriques", drive: "https://drive.google.com/drive/folders/153km2rrkL-m37bxEjN4gFX93N9NIPHFZ", yt: "https://www.youtube.com/playlist?list=PL8K5Y6-aFNbGjGeA3ICqTdNEUYf8AKtcJ" },
          { name: "Variateurs de vitesse industriels", drive: "https://drive.google.com/drive/folders/16ZwnObRpKkU0IrAGInr3L-Ahh_XIp3WV", yt: "#" },
        ],
      },
      {
        id: "M5",
        title: "Projet de Développement Technologique",
        elements: [
          { name: "Projet de développement technologique", drive: "https://drive.google.com/drive/folders/15lnRu5mV3BPyt5Q3MVJ9sNUCyLROwXxg", yt: "#" },
        ],
      },
      {
        id: "M6",
        title: "Environnement Économique d'Entreprise",
        elements: [
          { name: "Environnement économique d'entreprise", drive: "https://drive.google.com/drive/folders/1d80LVXBDSJo3KNR16SxgPTIFI0HNH4PV", yt: "#" },
        ],
      },
      {
        id: "M7",
        title: "Langues et Communication 2",
        elements: [
          { name: "Business communication", drive: "https://drive.google.com/drive/folders/1KJd3v4YkKve_SZJXbS60k7_kCqvEUbni", yt: "#" },
          { name: "Processus pour l'Insertion Professionnelle (PIP)", drive: "https://drive.google.com/drive/folders/1HvRP_F-zvkg8QkUA0KoNnppD6YH3xKHr", yt: "#" },
        ],
      },
    ],
  },
  s5_commun: {
    title: "S5 Commun",
    subtitle: "Tronc Commun • 3ème Année",
    modules: [
      {
        id: "C1",
        title: "Gestion Industrielle et Stage 2",
        elements: [
          { name: "Gestion industrielle", drive: "https://drive.google.com/drive/folders/1JDKGpmnBjljoiUS-Q0etBby9iXUharUd", yt: "#" },
          { name: "Stage 2", drive: "https://drive.google.com/drive/folders/1p59iaVCS-4AsRjhmNsuWfoC0zMWcs7Oo", yt: "#" },
        ],
      },
      {
        id: "C2",
        title: "Gestion de Projet et Pilotage de la Performance",
        elements: [
          { name: "Gestion de projet et pilotage de la performance", drive: "https://drive.google.com/drive/folders/13MsDosdVvbiuqYWW3YH2xkckn0o0AL_g", yt: "#" },
        ],
      },
      {
        id: "C3",
        title: "Langues et Cultures 3",
        elements: [
          { name: "Cultural and Social Anthropology", drive: "https://drive.google.com/drive/folders/1SLfKqQVRV1GsQW7DCw0_k2tCPqhxVDrL", yt: "#" },
          { name: "Préparation à la Certification DALF C1", drive: "https://drive.google.com/drive/folders/13c__G3xeppAUr-TlI3vUjt3lvOjsXRv4", yt: "#" },
        ],
      },
    ],
  },
  isnm: {
    title: "Option ISNM",
    subtitle: "Ingénierie des Systèmes Numériques et Mécatroniques",
    links: [
      {
        type: "dropdown",
        name: "Discord 3A",
        icon: "discord",
        items: [
          { name: "Promo 2027 · ISNM, ISE & ISEI", url: "https://discord.gg/gMWzvHxeX" },
        ],
      },
    ],
    modules: [
      {
        id: "O1",
        title: "Robotique Industrielle",
        elements: [
          { name: "Généralités et modélisation des robots industriels", drive: "https://drive.google.com/drive/folders/1LeJsbXKoiCnZAhW9szyVJwtwen22Dosz", yt: "#" },
          { name: "Commande des robots industriels", drive: "https://drive.google.com/drive/folders/11GkbqGtQwgzW5KCF-q-iSqHSFj3EEbqY", yt: "#" },
        ],
      },
      {
        id: "O2",
        title: "Maintenance Industrielle",
        elements: [
          { name: "Méthodes et gestion de la maintenance industrielle", drive: "https://drive.google.com/drive/folders/1VeI2TxeYhDSXAn4cISKD_Af2gk0_OHEx", yt: "#" },
          { name: "Maintenance industrielle assistée par ordinateur (GMAO)", drive: "https://drive.google.com/drive/folders/16ydLtN6kBMo9jv3GHXWBj-dlg0PDWTPx", yt: "#" },
        ],
      },
      {
        id: "O3",
        title: "Conception et Prototypage des Systèmes Mécatroniques",
        elements: [
          { name: "Conception des systèmes mécatroniques", drive: "https://drive.google.com/drive/folders/1x_MvCUjyYwVljRX5fJMaXVtleDyUy_XF", yt: "#" },
          { name: "Prototypage des systèmes mécatroniques", drive: "https://drive.google.com/drive/folders/1tN8AsCvee0mT4Dzg5Ui7u54Y_9xTiOff", yt: "#" },
        ],
      },
      {
        id: "O4",
        title: "Commandes Avancées des Systèmes",
        elements: [
          { name: "Systèmes non linéaires", drive: "https://drive.google.com/drive/folders/1XHaDWvrSPUTprUqewTvsdvCAsX-u4q6n", yt: "#" },
          { name: "Commande floue et réseaux de neurones", drive: "https://drive.google.com/drive/folders/1oQvniarNSXv9__Invh5aZJ8g8PuMUlVo", yt: "#" },
        ],
      },
    ],
  },
  ise: {
    title: "Option ISE",
    subtitle: "Ingénierie des Systèmes Embarqués",
    links: [
      {
        type: "dropdown",
        name: "Discord 3A",
        icon: "discord",
        items: [
          { name: "Promo 2027 · ISNM, ISE & ISEI", url: "https://discord.gg/gMWzvHxeX" },
        ],
      },
    ],
    modules: [
      {
        id: "O1",
        title: "Conception et Validation des Systèmes Embarqués",
        elements: [
          { name: "Conception des systèmes embarqués", drive: "https://drive.google.com/drive/folders/12-sy9I0y1gD9MFqfYQlQnvGurP-NF7zF", yt: "#" },
          { name: "Normes et tests des systèmes embarqués", drive: "https://drive.google.com/drive/folders/1cj71cu8FHxTD3slf-z3t1ApvZZqZ4SoV", yt: "#" },
        ],
      },
      {
        id: "O2",
        title: "Technologies des Systèmes Embarqués",
        elements: [
          { name: "Computer vision", drive: "https://drive.google.com/drive/folders/1EHRrXNtDY-PQXmvo-ZiG9uP3Q4CSfiTG", yt: "#" },
          { name: "Mobilité et véhicules électriques", drive: "https://drive.google.com/drive/folders/1VHQnQFxr0O5IuvspQh9vAdJ3-e0Dz3x2", yt: "#" },
        ],
      },
      {
        id: "O3",
        title: "Objets Connectés et Systèmes Intelligents",
        elements: [
          { name: "Objets connectés", drive: "https://drive.google.com/drive/folders/12B5QO74wDJuXQnN2JtncnB7IyHBNREcp", yt: "#" },
          { name: "Systèmes intelligents", drive: "https://drive.google.com/drive/folders/1Owz2IRTNZD41T70booBHTlXn6AWrWwhL", yt: "#" },
        ],
      },
      {
        id: "O4",
        title: "Systèmes d'Exploitation et Temps Réel",
        elements: [
          { name: "Système temps réel", drive: "https://drive.google.com/drive/folders/13gcUu4xGvxHqy_qP-uxVGrq8MYRlBsxk", yt: "#" },
          { name: "Système d'exploitation embarqué", drive: "https://drive.google.com/drive/folders/1kNCr3aAGMlXFHWBem55eRop6aEXj3edn", yt: "#" },
        ],
      },
    ],
  },
  isei: {
    title: "Option ISEI",
    subtitle: "Ingénierie des Systèmes Électriques Intelligents",
    links: [
      {
        type: "dropdown",
        name: "Discord 3A",
        icon: "discord",
        items: [
          { name: "Promo 2027 · ISNM, ISE & ISEI", url: "https://discord.gg/gMWzvHxeX" },
        ],
      },
    ],
    modules: [
      {
        id: "O1",
        title: "Maintenance Industrielle",
        elements: [
          { name: "Méthodes et gestion de la maintenance industrielle", drive: "https://drive.google.com/drive/folders/1J-XPetURmdCdayJ_IXmcyKiIMZi127rQ", yt: "#" },
          { name: "Maintenance industrielle assistée par ordinateur (GMAO)", drive: "https://drive.google.com/drive/folders/1bMixe-aj84DRfZtIjSRjCxcramI_rEE3", yt: "#" },
        ],
      },
      {
        id: "O2",
        title: "Conception des Systèmes Électriques",
        elements: [
          { name: "Outils logiciels d'étude et de conception", drive: "https://drive.google.com/drive/folders/1LfnlRahtwIkr9RxYAJoDTccqLXizi1Hj", yt: "#" },
          { name: "Travaux de bureau d'études", drive: "https://drive.google.com/drive/folders/167VTm5lBGuWoaB3b2IQKOQh7NIqHOHHv", yt: "#" },
        ],
      },
      {
        id: "O3",
        title: "Audit et Efficacité Énergétique",
        elements: [
          { name: "Audit énergétique", drive: "https://drive.google.com/drive/folders/1L-V6RGdaUNTQZK5QsLfsEWm0q6c1luSg", yt: "#" },
          { name: "Efficacité énergétique", drive: "https://drive.google.com/drive/folders/1DvD6hoGtsLKQTYwXJCCnUGQMnYSRZ20h", yt: "#" },
        ],
      },
      {
        id: "O4",
        title: "Les Réseaux Électriques",
        elements: [
          { name: "Production et transport de l'énergie électrique", drive: "https://drive.google.com/drive/folders/1dTKK0ADBMcH_y1ohGeDDWhViSI5WO5zG", yt: "#" },
          { name: "Distribution et utilisation de l'énergie électrique", drive: "https://drive.google.com/drive/folders/1cXYNaeZkl_nplM0mEQcmL5k1ubIFse1n", yt: "#" },
        ],
      },
    ],
  },
};
