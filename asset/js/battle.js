// Variables globales
let playerPokemon = null;
let opponentPokemon = null;
let battleState = 'selection'; // 'selection', 'battle', 'end'

// Éléments DOM
const battleMessage = document.querySelector('.battle-message');
const battleActions = document.querySelector('.battle-actions');
const pokemonList = document.querySelector('.pokemon-list');
const playerPokemonElement = document.querySelector('.player-pokemon');
const opponentPokemonElement = document.querySelector('.opponent-pokemon');

// Fonction pour charger les Pokémon disponibles
async function loadAvailablePokemon() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const data = await response.json();
        
        pokemonList.innerHTML = '';
        data.results.forEach(pokemon => {
            const pokemonId = pokemon.url.split('/')[6];
            const pokemonCard = document.createElement('div');
            pokemonCard.className = 'pokemon-card';
            pokemonCard.innerHTML = `
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png" alt="${pokemon.name}">
                <h3>${pokemon.name}</h3>
            `;
            pokemonCard.addEventListener('click', () => selectPokemon(pokemonId));
            pokemonList.appendChild(pokemonCard);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des Pokémon:', error);
        battleMessage.textContent = 'Erreur lors du chargement des Pokémon';
    }
}

// Fonction pour sélectionner un Pokémon
async function selectPokemon(pokemonId) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        const data = await response.json();
        
        playerPokemon = {
            id: data.id,
            name: data.name,
            hp: data.stats[0].base_stat,
            maxHp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            sprite: data.sprites.versions['generation-v']['black-white'].animated.front_default || data.sprites.front_default
        };

        // Générer un Pokémon adverse aléatoire
        const randomId = Math.floor(Math.random() * 151) + 1;
        const opponentResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const opponentData = await opponentResponse.json();
        
        opponentPokemon = {
            id: opponentData.id,
            name: opponentData.name,
            hp: opponentData.stats[0].base_stat,
            maxHp: opponentData.stats[0].base_stat,
            attack: opponentData.stats[1].base_stat,
            defense: opponentData.stats[2].base_stat,
            sprite: opponentData.sprites.versions['generation-v']['black-white'].animated.back_default || opponentData.sprites.back_default
        };

        // Mettre à jour l'interface
        updateBattleUI();
        battleState = 'battle';
        battleMessage.textContent = `Le combat commence! ${playerPokemon.name} VS ${opponentPokemon.name}`;
        
        // Afficher immédiatement les boutons d'action
        showBattleActions();
    } catch (error) {
        console.error('Erreur lors de la sélection du Pokémon:', error);
        battleMessage.textContent = 'Erreur lors de la sélection du Pokémon';
    }
}

// Fonction pour afficher les boutons d'action
function showBattleActions() {
    battleActions.innerHTML = `
        <button onclick="attack()">Attaquer</button>
        <button onclick="useItem()">Utiliser un objet</button>
    `;
}

// Fonction pour mettre à jour l'interface de combat
function updateBattleUI() {
    // Mettre à jour le Pokémon du joueur
    playerPokemonElement.innerHTML = `
        <div class="pokemon-info">
            <h2>${playerPokemon.name}</h2>
            <div class="health-bar">
                <div class="health-fill" style="width: ${(playerPokemon.hp / playerPokemon.maxHp) * 100}%"></div>
            </div>
            <p class="health-text">HP: ${playerPokemon.hp}/${playerPokemon.maxHp}</p>
        </div>
        <div class="pokemon-sprite">
            <img src="${playerPokemon.sprite}" alt="${playerPokemon.name}">
        </div>
    `;

    // Mettre à jour le Pokémon adverse
    opponentPokemonElement.innerHTML = `
        <div class="pokemon-info">
            <h2>${opponentPokemon.name}</h2>
            <div class="health-bar">
                <div class="health-fill" style="width: ${(opponentPokemon.hp / opponentPokemon.maxHp) * 100}%"></div>
            </div>
            <p class="health-text">HP: ${opponentPokemon.hp}/${opponentPokemon.maxHp}</p>
        </div>
        <div class="pokemon-sprite">
            <img src="${opponentPokemon.sprite}" alt="${opponentPokemon.name}">
        </div>
    `;
}

// Fonction pour l'attaque
function attack() {
    if (battleState !== 'battle') return;

    // Ajouter les classes d'animation
    const playerSprite = document.querySelector('.player-pokemon .pokemon-sprite img');
    const opponentSprite = document.querySelector('.opponent-pokemon .pokemon-sprite img');
    
    playerSprite.classList.add('attack-animation');
    opponentSprite.classList.add('damage-animation');

    // Calcul des dégâts
    const playerDamage = Math.max(1, Math.floor(playerPokemon.attack / opponentPokemon.defense * 10));
    const opponentDamage = Math.max(1, Math.floor(opponentPokemon.attack / playerPokemon.defense * 10));

    // Appliquer les dégâts
    opponentPokemon.hp = Math.max(0, opponentPokemon.hp - playerDamage);
    playerPokemon.hp = Math.max(0, playerPokemon.hp - opponentDamage);

    // Mettre à jour l'interface
    updateBattleUI();

    // Retirer les classes d'animation après un délai
    setTimeout(() => {
        playerSprite.classList.remove('attack-animation');
        opponentSprite.classList.remove('damage-animation');
    }, 1000);

    // Vérifier si le combat est terminé
    if (playerPokemon.hp === 0 || opponentPokemon.hp === 0) {
        endBattle();
    } else {
        battleMessage.textContent = `${playerPokemon.name} inflige ${playerDamage} dégâts! ${opponentPokemon.name} inflige ${opponentDamage} dégâts!`;
    }
}

// Fonction pour utiliser un objet
function useItem() {
    if (battleState !== 'battle') return;

    // Pour l'instant, on va simplement soigner le Pokémon
    const healAmount = 20;
    playerPokemon.hp = Math.min(playerPokemon.maxHp, playerPokemon.hp + healAmount);
    
    // L'adversaire attaque quand même
    const opponentDamage = Math.max(1, Math.floor(opponentPokemon.attack / playerPokemon.defense * 10));
    playerPokemon.hp = Math.max(0, playerPokemon.hp - opponentDamage);

    updateBattleUI();
    battleMessage.textContent = `${playerPokemon.name} récupère ${healAmount} PV! ${opponentPokemon.name} inflige ${opponentDamage} dégâts!`;

    if (playerPokemon.hp === 0) {
        endBattle();
    }
}

// Fonction pour terminer le combat
function endBattle() {
    battleState = 'end';
    if (playerPokemon.hp === 0) {
        battleMessage.textContent = `${opponentPokemon.name} a gagné!`;
    } else {
        battleMessage.textContent = `${playerPokemon.name} a gagné!`;
    }

    battleActions.innerHTML = `
        <button onclick="resetBattle()">Nouveau combat</button>
    `;
}

// Fonction pour réinitialiser le combat
function resetBattle() {
    battleState = 'selection';
    playerPokemon = null;
    opponentPokemon = null;
    battleMessage.textContent = 'Sélectionnez un Pokémon pour commencer le combat';
    battleActions.innerHTML = '';
    loadAvailablePokemon();
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadAvailablePokemon();
}); 