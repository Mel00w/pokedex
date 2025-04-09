const BASE_URL = "https://pokeapi.co/api/v2";

globalThis.allPokemons = [];

const typeTranslations = {
  water: "Eau",
  fire: "Feu",
  electric: "Électrik",
  grass: "Plante",
  psychic: "Psy",
  bug: "Insecte",
  ghost: "Spectre",
  ice: "Glace",
  dragon: "Dragon",
  dark: "Ténèbres",
  fairy: "Fée",
  fighting: "Combat",
  rock: "Roche",
  ground: "Sol",
  steel: "Acier",
  poison: "Poison",
  flying: "Vol",
  normal: "Normal",
};

const typeColors = {
  water: "#00BFFF4f",
  fire: "#F080304f",
  electric: "#FFD7004f",
  grass: "#78C8504f",
  psychic: "#F858884f",
  bug: "#8B00004f",
  ghost: "#8000804f",
  ice: "#98D8D84f",
  dragon: "#8A2BE24f",
  dark: "#0000004f",
  fairy: "#FFB6C14f",
  fighting: "#A52A2A4f",
  rock: "#A9A9A94f",
  ground: "#DEB8874f",
  steel: "#C0C0C04f",
  poison: "#A040A04f",
  flying: "#A890F04f",
  normal: "#f1c1c14f",
};

const POKEMONS_PER_LOAD = 10;
let currentPage = 1;
let pokemons = [];
let currentType = "";

function options(method = "GET") {
  return { method, headers: { "Content-Type": "application/json" } };
}

async function listPokemonTypes() {
  try {
    const res = await fetch(`${BASE_URL}/type`, options());
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

    const { results } = await res.json();
    const filtered = results.filter(
      (t) => !["unknown", "stellar"].includes(t.name)
    );
    const container = document.getElementById("type-buttons-container");

    filtered.forEach((type) => {
      const btn = document.createElement("button");
      btn.textContent = typeTranslations[type.name] || type.name;
      btn.dataset.type = type.name;
      btn.addEventListener("click", () => selectType(btn, type));
      container.appendChild(btn);
    });
  } catch (err) {
    console.error("Erreur chargement types:", err);
  }
}

function selectType(button, type) {
  document.querySelectorAll("#type-buttons-container button").forEach((btn) => {
    btn.classList.remove("active");
    btn.style.removeProperty("--active-color");
  });

  button.classList.add("active");
  button.style.setProperty("--active-color", typeColors[type.name]);
  fetchPokemonByType(type.name, type.url);
}

async function fetchPokemonByType(typeName, url) {
  try {
    currentPage = 1;
    pokemons = [];
    currentType = typeName;

    const container = document.getElementById("pokemon-container");
    container.innerHTML = "";

    const res = await fetch(url, options());
    const { pokemon } = await res.json();
    pokemons = pokemon;

    loadPokemonBatch(container);
    enableInfiniteScroll(container);
    document.getElementById("search-bar").value = "";
  } catch (err) {
    console.error("Erreur chargement par type:", err);
  }
}

function loadPokemonBatch(container) {
  const start = (currentPage - 1) * POKEMONS_PER_LOAD;
  const batch = pokemons.slice(start, start + POKEMONS_PER_LOAD);
  batch.forEach((p) => getPokemonDetails((p.pokemon || p).url, container));

  if (currentPage === 1) document.body.classList.add("pokemon-loaded");
  currentPage++;
}

async function getPokemonDetails(url, container) {
  try {
    const res = await fetch(url, options());
    const p = await res.json();
    const types = p.types.map((t) => {
      const name = t.type.name;
      return {
        name: typeTranslations[name] || name,
        color: typeColors[name] || "#FFFFFF",
      };
    });

    const gradient = types.map((t) => addAlpha(t.color)).slice(0, 2);
    const bgStyle =
      gradient.length === 2
        ? `background: linear-gradient(to bottom right, ${gradient.join(",")});`
        : `background-color: ${gradient[0]}`;

    const typeBadges = types
      .map(
        (t) =>
          `<span class="type" style="background:${t.color}">${t.name}</span>`
      )
      .join(" ");

    container.innerHTML += `
      <div class="tilt-container">
        <div class="pokemon-card" style="${bgStyle}" onclick="location.href='pokemon-details.html?pokemon=${p.name}'">
          <p>N°${p.id}</p>
          <h3>${p.name}</h3>
          <img src="${p.sprites.front_default}" alt="${p.name}" />
          <p>Types: ${typeBadges}</p>
        </div>
      </div>
    `;

    enableCardTilt();
  } catch (err) {
    console.error("Erreur détails Pokémon:", err);
  }
}

function enableCardTilt() {
  document.querySelectorAll(".pokemon-card").forEach((card) => {
    card.onmousemove = (e) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = e.clientX - left - width / 2;
      const y = e.clientY - top - height / 2;
      const rotateX = (-y / height) * 10;
      const rotateY = (x / width) * 10;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    card.onmouseleave = () => (card.style.transform = "rotateX(0) rotateY(0)");
    card.onmouseenter = () => (card.style.transition = "transform 0.1s ease");
  });
}

function addAlpha(hex, alpha = "1a") {
  return hex.length === 7 ? hex + alpha : hex;
}

function handleScroll(container) {
  const chevron = document.querySelector(".chevron");
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    if (currentPage <= Math.ceil(pokemons.length / POKEMONS_PER_LOAD)) {
      loadPokemonBatch(container);
    } else {
      chevron.style.display = "none";
    }
  } else {
    chevron.style.display = "block";
  }
}

function enableInfiniteScroll(container) {
  window.onscroll = () => handleScroll(container);
}

async function fetchAllPokemons() {
  try {
    currentPage = 1;
    pokemons = [];
    currentType = "";

    const container = document.getElementById("pokemon-container");
    container.innerHTML = "";

    const res = await fetch(`${BASE_URL}/pokemon?limit=1302`, options());
    const data = await res.json();

    pokemons = data.results;
    globalThis.allPokemons = data.results;

    loadPokemonBatch(container);
    enableInfiniteScroll(container);
  } catch (err) {
    console.error("Erreur chargement tous Pokémon:", err);
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const container = document.getElementById("pokemon-container");
  container.innerHTML = "";

  if (!query) {
    pokemons = currentType ? pokemons : globalThis.allPokemons;
    currentPage = 1;
    loadPokemonBatch(container);
    return;
  }

  const filtered = globalThis.allPokemons.filter((p) => p.name.includes(query));
  if (!filtered.length) {
    container.innerHTML = "<p>Aucun Pokémon trouvé 😢</p>";
    return;
  }

  pokemons = filtered.map((p) => ({ pokemon: p }));
  currentPage = 1;
  loadPokemonBatch(container);
}

listPokemonTypes();
fetchAllPokemons();
document.getElementById("search-bar").addEventListener("input", handleSearch);
