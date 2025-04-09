const getPokemonNameFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("pokemon");
};

const getPokemonData = async (identifier) => {
    try {
        const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier.toLowerCase()}`);
        const pokemon = await pokemonRes.json();

        // Mettre à jour le numéro actuel dans l'interface
        document.getElementById('current-id').textContent = `N°${pokemon.id.toString().padStart(4, '0')}`;

        // Configurer les boutons de navigation
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');

        prevButton.onclick = () => {
            if (pokemon.id > 1) {
                window.location.href = `pokemon-details.html?pokemon=${pokemon.id - 1}`;
            }
        };

        nextButton.onclick = () => {
            window.location.href = `pokemon-details.html?pokemon=${pokemon.id + 1}`;
        };

        // Désactiver le bouton précédent si on est au premier Pokémon
        if (pokemon.id === 1) {
            prevButton.disabled = true;
            prevButton.style.opacity = '0.5';
        }

        const speciesRes = await fetch(pokemon.species.url);
        const species = await speciesRes.json();

        const typesData = await Promise.all(
            pokemon.types.map((t) => fetch(t.type.url).then((res) => res.json()))
        );

        const weaknesses = new Set();
        typesData.forEach((type) => {
            type.damage_relations.double_damage_from.forEach((weak) => weaknesses.add(weak.name));
        });

        const evolutionChainRes = await fetch(species.evolution_chain.url);
        const evolutionChain = await evolutionChainRes.json();
        const evolutionList = getEvolutionChain(evolutionChain.chain);

        displayPokemon(pokemon, species, [...weaknesses], evolutionList);
    } catch (err) {
        document.getElementById("pokemon-details").innerHTML = `
            <div class="error-message">
                <h2>Pokémon non trouvé 🥲</h2>
                <p>Le Pokémon que vous recherchez n'existe pas ou n'est pas disponible.</p>
                <a href="index.html" class="return-button">Retour au Pokédex</a>
            </div>
        `;
    }
};

const getEvolutionChain = (chain) => {
    let evoChain = [];
    let current = chain;

    while (current) {
        evoChain.push(current.species.name);
        current = current.evolves_to[0];
    }

    return evoChain;
};

const displayPokemon = (pokemon, species, weaknesses, evolutionList) => {
    const container = document.getElementById("pokemon-details");
    const name = pokemon.name[0].toUpperCase() + pokemon.name.slice(1);
    const id = pokemon.id.toString().padStart(4, "0");
    const types = pokemon.types.map((t) => t.type.name);
    const abilities = pokemon.abilities.map((a) => a.ability.name).join(", ");
    const height = pokemon.height / 10;
    const weight = pokemon.weight / 10;
    const category = species.genera.find((g) => g.language.name === "fr")?.genus || "Pokémon";
    const genderRate = species.gender_rate;
    const genderHTML = genderRate === -1 ? "?" : "♂ ♀";

    container.innerHTML = `
        <div class="pokemon-card">
            <div class="image-block">
                <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${name}" />
            </div>
            <div class="description">
                <p class="flavor">Un Pokémon de type ${types.join(" et ")}.</p>
                <div class="info-block">
                    <p><strong>Taille:</strong> ${height} m</p>
                    <p><strong>Poids:</strong> ${weight} kg</p>
                    <p><strong>Catégorie:</strong> ${category}</p>
                    <p><strong>Talent:</strong> ${abilities}</p>
                    <p><strong>Sexe:</strong> ${genderHTML}</p>
                    <div class="types">
                        ${types.map((type) => `<span class="type ${type}">${type}</span>`).join(" ")}
                    </div>
                </div>
                <div class="weaknesses">
                    <h3>Faiblesses</h3>
                    <div class="weakness-list">
                        ${weaknesses.map((w) => `<span class="weakness ${w}">${w}</span>`).join(" ")}
                    </div>
                </div>
            </div>
            <div class="stats">
                <h2>Stats de base</h2>
                <div class="stats-bars">
                    ${pokemon.stats
                        .map(
                            (stat) => `
                        <div class="stat-bar">
                            <span>${stat.stat.name}</span>
                            <div class="bar">
                                <div style="width: ${(stat.base_stat / 200) * 100}%; background-color: #4CAF50;">
                                    <span style="color: white; font-size: 12px; padding-left: 4px;">${stat.base_stat}</span>
                                </div>
                            </div>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            </div>
            <div class="evolutions">
                <h2>Évolutions</h2>
                <ul>
                    ${evolutionList.map((evo) => `<li>${evo}</li>`).join("")}
                </ul>
            </div>
        </div>
    `;
};

// Démarrage
const pokemonToLoad = getPokemonNameFromURL();
getPokemonData(pokemonToLoad);
  