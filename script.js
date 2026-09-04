// Variables globales
let organismData = null;
let formationsData = [];
let sessionsData = [];
let currentFilter = 'all';
let searchQuery = '';
let currentHierarchyFilter = { type: null, value: null }; // Pour filtrer par secteur/famille/groupe
let usingFictiveData = false; // Indique si on utilise des données fictives
let localConfig = null; // Configuration locale (local.json)
let customPagesCache = {}; // Cache pour les pages personnalisées chargée

// Filtres avancés
let advancedFilters = {
  secteur: null,
  famille: null,
  groupe: null,
  dureeType: 'heures', // 'heures' ou 'jours'
  dureeMin: null,
  dureeMax: null,
  prixType: null, // 'apprenant' ou 'groupe'
  prixMin: null,
  prixMax: null,
  certifiante: null // true, false, null
};

let showFilters = false;

// Instances des range sliders
let dureeSlider = null;
let prixSlider = null;

// Créer les modales dynamiquement
function createModals() {
  // Vérifier si les modales existent déjà
  if (document.getElementById('contact-modal')) {
    return; // Les modales existent déjà
  }

  // Créer la modale de contact
  const contactModalHTML = `
  <dialog id="contact-modal" class="contact-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">Demande de Contact</h2>
        <button type="button" class="modal-close" onclick="closeContactModal()" aria-label="Fermer">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <form id="contact-form" class="modal-form" novalidate>
        <input type="hidden" id="form-type" name="formType" value="">
        <input type="hidden" id="user-type" name="userType" value="particulier">
        <input type="hidden" id="formation-name" name="formation" value="">
        <input type="hidden" id="product-reference" name="product_reference" value="">
        <input type="hidden" id="session-date" name="session_date" value="">
        <input type="hidden" id="session-lieu" name="session_lieu" value="">
        <input type="hidden" id="session-reference" name="session_reference" value="">
        
        <div class="user-type-toggle">
          <label class="toggle-label">Type de demande</label>
          <div class="toggle-switch">
            <button type="button" class="toggle-option active" data-type="particulier" onclick="switchUserType('particulier')">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Particulier
            </button>
            <button type="button" class="toggle-option" data-type="entreprise" onclick="switchUserType('entreprise')">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              Entreprise
            </button>
          </div>
        </div>
        
        <div id="session-info" class="session-info" style="display: none;">
          <div class="session-reference-badge">
            <span id="session-reference-text"></span>
          </div>
          <div class="session-info-header">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Informations de la session</span>
          </div>
          <div class="session-info-content">
            <p id="session-info-text"></p>
          </div>
        </div>
        
        <div id="preinscription-notice" class="preinscription-notice" style="display: none;">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>Ceci est une demande de préinscription. Notre équipe vous recontactera prochainement pour confirmer votre inscription et répondre à vos questions.</p>
        </div>
        
        <div id="particulier-fields">
          <div class="form-row">
            <div class="form-group">
              <label for="contact-lastname" class="form-label">Nom <span class="required">*</span></label>
              <input type="text" id="contact-lastname" name="lastname" class="form-input" placeholder="Nom" required>
            </div>
            <div class="form-group">
              <label for="contact-firstname" class="form-label">Prénom <span class="required">*</span></label>
              <input type="text" id="contact-firstname" name="firstname" class="form-input" placeholder="Prénom" required>
            </div>
            <div class="form-group">
              <label for="contact-email" class="form-label">Email <span class="required">*</span></label>
              <input type="email" id="contact-email" name="email" class="form-input" placeholder="votre.email@exemple.com" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="contact-phone-mobile" class="form-label">Tél. portable <span id="phone-mobile-required" class="required" style="display: none;">*</span></label>
              <input type="tel" id="contact-phone-mobile" name="phone_mobile" class="form-input" placeholder="06 12 34 56 78">
            </div>
            <div class="form-group">
              <label for="contact-phone-fixed" class="form-label">Tél. fixe</label>
              <input type="tel" id="contact-phone-fixed" name="phone_fixed" class="form-input" placeholder="01 23 45 67 89">
            </div>
            <div class="form-group">
              <label for="contact-address" class="form-label">Adresse</label>
              <input type="text" id="contact-address" name="address" class="form-input" placeholder="Numéro et nom de rue">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 0 0 30%; position: relative;">
              <label for="contact-postal-code" class="form-label">Code postal</label>
              <input type="text" id="contact-postal-code" name="postal_code" class="form-input" placeholder="75001" maxlength="5" autocomplete="off">
              <div id="contact-postal-suggestions" class="suggestions-dropdown" style="display: none;"></div>
            </div>
            <div class="form-group" style="flex: 1; position: relative;">
              <label for="contact-city" class="form-label">Ville</label>
              <input type="text" id="contact-city" name="city" class="form-input" placeholder="Paris" autocomplete="off">
              <div id="contact-city-suggestions" class="suggestions-dropdown" style="display: none;"></div>
            </div>
          </div>
          <div class="form-group">
            <label for="contact-message" class="form-label">Message <span id="message-required" class="required">*</span></label>
            <textarea id="contact-message" name="message" class="form-textarea" rows="3" placeholder="Décrivez votre demande..."></textarea>
          </div>
        </div>
        
        <div id="entreprise-fields" style="display: none;">
          <div class="form-group">
            <label for="company-name" class="form-label">Nom de l'entreprise <span class="required">*</span></label>
            <div style="position: relative;">
              <input type="text" id="company-name" name="company_name" class="form-input" placeholder="Rechercher une entreprise..." autocomplete="off" required>
              <div id="company-suggestions" class="suggestions-dropdown" style="display: none;"></div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="company-contact-lastname" class="form-label">Nom du contact <span class="required">*</span></label>
              <input type="text" id="company-contact-lastname" name="contact_lastname" class="form-input" placeholder="Nom" required>
            </div>
            <div class="form-group">
              <label for="company-contact-firstname" class="form-label">Prénom du contact <span class="required">*</span></label>
              <input type="text" id="company-contact-firstname" name="contact_firstname" class="form-input" placeholder="Prénom" required>
            </div>
            <div class="form-group">
              <label for="company-contact-function" class="form-label">Fonction</label>
              <input type="text" id="company-contact-function" name="contact_function" class="form-input" placeholder="Responsable formation...">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label for="company-email" class="form-label">Email du contact <span class="required">*</span></label>
              <input type="email" id="company-email" name="contact_email" class="form-input" placeholder="contact@entreprise.com" required>
            </div>
            <div class="form-group">
              <label for="company-phone-mobile" class="form-label">Tél. portable <span id="company-phone-mobile-required" class="required" style="display: none;">*</span></label>
              <input type="tel" id="company-phone-mobile" name="contact_phone_mobile" class="form-input" placeholder="06 12 34 56 78">
            </div>
            <div class="form-group">
              <label for="company-phone-fixed" class="form-label">Tél. fixe</label>
              <input type="tel" id="company-phone-fixed" name="contact_phone_fixed" class="form-input" placeholder="01 23 45 67 89">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 0 0 40%;">
              <label for="company-siret" class="form-label">SIRET</label>
              <input type="text" id="company-siret" name="siret" class="form-input" placeholder="14 chiffres" maxlength="14" pattern="[0-9]{14}">
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="company-address-street" class="form-label">Adresse</label>
              <input type="text" id="company-address-street" name="address_street" class="form-input" placeholder="Numéro et nom de rue">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 0 0 25%; position: relative;">
              <label for="company-postal-code" class="form-label">Code postal</label>
              <input type="text" id="company-postal-code" name="company_postal_code" class="form-input" placeholder="75001" maxlength="5" autocomplete="off">
              <div id="company-postal-suggestions" class="suggestions-dropdown" style="display: none;"></div>
            </div>
            <div class="form-group" style="flex: 1; position: relative;">
              <label for="company-city" class="form-label">Ville</label>
              <input type="text" id="company-city" name="company_city" class="form-input" placeholder="Paris" autocomplete="off">
              <div id="company-city-suggestions" class="suggestions-dropdown" style="display: none;"></div>
            </div>
            <div class="form-group" style="flex: 0 0 35%;" id="participant-count-group">
              <label for="participant-count" class="form-label">Nb de participants</label>
              <input type="number" id="participant-count" name="participant_count" class="form-input" min="1" placeholder="Nombre">
            </div>
          </div>
          <div id="participant-list-group" style="display: none;">
            <div class="form-row">
              <div class="form-group" style="flex: 0 0 30%;">
                <label for="participant-list-count" class="form-label">Nb de participants</label>
                <input type="number" id="participant-list-count" name="participant_list_count" class="form-input" min="1" placeholder="Nombre">
                <small class="form-hint">Nombre total</small>
              </div>
              <div class="form-group" style="flex: 1;">
                <label for="participant-list" class="form-label">Liste des participants <span style="font-weight: normal; font-size: 0.875rem;">(optionnel)</span></label>
                <textarea id="participant-list" name="participant_list" class="form-textarea" rows="3" placeholder="Nom et prénom de chaque participant (un par ligne)"></textarea>
                <small class="form-hint">Un nom par ligne si connus à l'avance</small>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="company-message" class="form-label">Message <span id="company-message-required" class="required">*</span></label>
            <textarea id="company-message" name="company_message" class="form-textarea" rows="3" placeholder="Décrivez votre demande..."></textarea>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="closeContactModal()">Annuler</button>
          <button type="submit" class="btn btn-default" id="submit-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: inline; margin-right: 0.5rem;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span id="submit-text">Envoyer</span>
          </button>
        </div>
        
        <div id="form-message" class="form-message" style="display: none;"></div>
      </form>
    </div>
  </dialog>

  <dialog id="success-modal" class="success-modal">
    <div class="success-modal-content">
      <div class="success-icon">
        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h2 class="success-title">Message envoyé avec succès !</h2>
      <p class="success-message" id="success-message-text">Votre demande a bien été envoyée. Nous vous contacterons dans les plus brefs délais.</p>
      <button type="button" class="success-button" onclick="closeSuccessModal()">Fermer</button>
    </div>
  </dialog>`;

  document.body.insertAdjacentHTML('beforeend', contactModalHTML);
}

// Initialiser les event listeners du formulaire
function initFormListeners() {
  const contactForm = document.getElementById('contact-form');
  const modal = document.getElementById('contact-modal');

  console.log('📝 Formulaire trouvé:', contactForm ? 'OUI' : 'NON');

  if (!contactForm) {
    console.error('❌ ERREUR: Le formulaire contact-form n\'a pas été trouvé !');
    return;
  }

  // Fermer au clic en dehors
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeContactModal();
    }
  });

  // Fermer avec la touche Échap
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContactModal();
    }
  });

  // ============================================
  // Formatage Automatique des Champs
  // ============================================

  // Particulier - Nom
  const contactLastnameInput = document.getElementById('contact-lastname');
  contactLastnameInput.addEventListener('blur', (e) => {
    e.target.value = formatLastName(e.target.value);
  });

  // Particulier - Prénom
  const contactFirstnameInput = document.getElementById('contact-firstname');
  contactFirstnameInput.addEventListener('blur', (e) => {
    e.target.value = formatFirstName(e.target.value);
  });

  // Entreprise - Nom du contact
  const companyContactLastnameInput = document.getElementById('company-contact-lastname');
  companyContactLastnameInput.addEventListener('blur', (e) => {
    e.target.value = formatLastName(e.target.value);
  });

  // Entreprise - Prénom du contact
  const companyContactFirstnameInput = document.getElementById('company-contact-firstname');
  companyContactFirstnameInput.addEventListener('blur', (e) => {
    e.target.value = formatFirstName(e.target.value);
  });

  // Particulier - Ville
  const contactCityInputFormat = document.getElementById('contact-city');
  contactCityInputFormat.addEventListener('blur', (e) => {
    if (e.target.value.trim()) {
      e.target.value = formatCityName(e.target.value);
    }
  });

  // Entreprise - Ville
  const companyCityInputFormat = document.getElementById('company-city');
  companyCityInputFormat.addEventListener('blur', (e) => {
    if (e.target.value.trim()) {
      e.target.value = formatCityName(e.target.value);
    }
  });

  // ============================================
  // Écouteurs pour l'API Sirene
  // ============================================
  const companyNameInput = document.getElementById('company-name');
  const companySiretInput = document.getElementById('company-siret');
  const suggestionsDiv = document.getElementById('company-suggestions');

  // Recherche par nom d'entreprise
  companyNameInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    // Annuler la recherche précédente
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 3) {
      suggestionsDiv.style.display = 'none';
      resetSuggestionSelection();
      return;
    }

    // Attendre 500ms avant de lancer la recherche
    searchTimeout = setTimeout(() => {
      searchCompanyByName(query);
      resetSuggestionSelection();
    }, 500);
  });

  // Navigation au clavier pour les suggestions d'entreprise
  companyNameInput.addEventListener('keydown', (e) => {
    if (suggestionsDiv.style.display !== 'none') {
      handleKeyboardNavigation(e, suggestionsDiv, companyNameInput);
    }
  });

  // Recherche par SIRET
  companySiretInput.addEventListener('input', (e) => {
    const siret = e.target.value.replace(/\s/g, '');
    if (siret.length === 14) {
      searchCompanyBySiret(siret);
      resetSuggestionSelection();
    }
  });

  // Navigation au clavier pour SIRET
  companySiretInput.addEventListener('keydown', (e) => {
    if (suggestionsDiv.style.display !== 'none') {
      handleKeyboardNavigation(e, suggestionsDiv, companySiretInput);
    }
  });

  // Fermer les suggestions au clic ailleurs
  document.addEventListener('click', (e) => {
    if (!companyNameInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.style.display = 'none';
      resetSuggestionSelection();
    }
  });

  // ============================================
  // Écouteurs pour l'API Géolocalisation des Villes
  // ============================================

  // Pour les particuliers
  const contactPostalCodeInput = document.getElementById('contact-postal-code');
  const contactCityInput = document.getElementById('contact-city');
  const contactPostalSuggestionsDiv = document.getElementById('contact-postal-suggestions');
  const contactCitySuggestionsDiv = document.getElementById('contact-city-suggestions');

  // Recherche par code postal (particulier)
  contactPostalCodeInput.addEventListener('input', (e) => {
    const postalCode = e.target.value.trim();

    if (citySearchTimeout) {
      clearTimeout(citySearchTimeout);
    }

    if (postalCode.length === 5) {
      citySearchTimeout = setTimeout(() => {
        searchCitiesByPostalCode(postalCode, contactCityInput, contactPostalSuggestionsDiv);
        resetSuggestionSelection();
      }, 300);
    } else {
      contactPostalSuggestionsDiv.style.display = 'none';
      resetSuggestionSelection();
    }
  });

  // Navigation au clavier pour code postal (particulier)
  contactPostalCodeInput.addEventListener('keydown', (e) => {
    if (contactPostalSuggestionsDiv.style.display !== 'none') {
      handleKeyboardNavigation(e, contactPostalSuggestionsDiv, contactPostalCodeInput);
    }
  });

  // Recherche par ville (particulier)
  contactCityInput.addEventListener('input', (e) => {
    const cityName = e.target.value.trim();

    if (citySearchTimeout) {
      clearTimeout(citySearchTimeout);
    }

    if (cityName.length >= 2) {
      citySearchTimeout = setTimeout(() => {
        searchCitiesByName(cityName, contactCityInput, contactPostalCodeInput, contactCitySuggestionsDiv);
        resetSuggestionSelection();
      }, 500);
    } else {
      contactCitySuggestionsDiv.style.display = 'none';
      resetSuggestionSelection();
    }
  });

  // Navigation au clavier pour ville (particulier)
  contactCityInput.addEventListener('keydown', (e) => {
    if (contactCitySuggestionsDiv.style.display !== 'none') {
      handleKeyboardNavigation(e, contactCitySuggestionsDiv, contactCityInput);
    }
  });

  // Pour les entreprises
  const companyPostalCodeInput = document.getElementById('company-postal-code');
  const companyCityInput = document.getElementById('company-city');
  const companyPostalSuggestionsDiv = document.getElementById('company-postal-suggestions');
  const companyCitySuggestionsDiv = document.getElementById('company-city-suggestions');

  // Recherche par code postal (entreprise)
  companyPostalCodeInput.addEventListener('input', (e) => {
    const postalCode = e.target.value.trim();

    if (citySearchTimeout) {
      clearTimeout(citySearchTimeout);
    }

    if (postalCode.length === 5) {
      citySearchTimeout = setTimeout(() => {
        searchCitiesByPostalCode(postalCode, companyCityInput, companyPostalSuggestionsDiv);
        resetSuggestionSelection();
      }, 300);
    } else {
      companyPostalSuggestionsDiv.style.display = 'none';
      resetSuggestionSelection();
    }
  });

  // Navigation au clavier pour code postal (entreprise)
  companyPostalCodeInput.addEventListener('keydown', (e) => {
    if (companyPostalSuggestionsDiv.style.display !== 'none') {
      handleKeyboardNavigation(e, companyPostalSuggestionsDiv, companyPostalCodeInput);
    }
  });

  // Recherche par ville (entreprise)
  companyCityInput.addEventListener('input', (e) => {
    const cityName = e.target.value.trim();

    if (citySearchTimeout) {
      clearTimeout(citySearchTimeout);
    }

    if (cityName.length >= 2) {
      citySearchTimeout = setTimeout(() => {
        searchCitiesByName(cityName, companyCityInput, companyPostalCodeInput, companyCitySuggestionsDiv);
        resetSuggestionSelection();
      }, 500);
    } else {
      companyCitySuggestionsDiv.style.display = 'none';
      resetSuggestionSelection();
    }
  });

  // Navigation au clavier pour ville (entreprise)
  companyCityInput.addEventListener('keydown', (e) => {
    if (companyCitySuggestionsDiv.style.display !== 'none') {
      handleKeyboardNavigation(e, companyCitySuggestionsDiv, companyCityInput);
    }
  });

  // Fermer les suggestions de ville au clic ailleurs
  document.addEventListener('click', (e) => {
    if (!contactPostalCodeInput.contains(e.target) &&
      !contactCityInput.contains(e.target) &&
      !contactPostalSuggestionsDiv.contains(e.target) &&
      !contactCitySuggestionsDiv.contains(e.target)) {
      contactPostalSuggestionsDiv.style.display = 'none';
      contactCitySuggestionsDiv.style.display = 'none';
      resetSuggestionSelection();
    }
    if (!companyPostalCodeInput.contains(e.target) &&
      !companyCityInput.contains(e.target) &&
      !companyPostalSuggestionsDiv.contains(e.target) &&
      !companyCitySuggestionsDiv.contains(e.target)) {
      companyPostalSuggestionsDiv.style.display = 'none';
      companyCitySuggestionsDiv.style.display = 'none';
      resetSuggestionSelection();
    }
  });

  // Personnaliser les messages de validation HTML5
  const requiredInputs = contactForm.querySelectorAll('[required]');
  requiredInputs.forEach(input => {
    input.addEventListener('invalid', (e) => {
      e.preventDefault();
      if (input.validity.valueMissing) {
        input.setCustomValidity('Ce champ est obligatoire');
      } else if (input.validity.typeMismatch && input.type === 'email') {
        input.setCustomValidity('Veuillez entrer une adresse email valide');
      }
    });

    input.addEventListener('input', () => {
      input.setCustomValidity('');
      input.classList.remove('invalid');
      // Masquer le message d'erreur si l'utilisateur corrige
      const formMessage = document.getElementById('form-message');
      if (formMessage.classList.contains('error')) {
        formMessage.style.display = 'none';
      }
    });
  });

  // Debug: Écouteur sur le bouton submit
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      console.log('🖱️ Clic sur le bouton Envoyer détecté');
      console.log('Type du bouton:', submitBtn.type);
      console.log('Formulaire parent:', submitBtn.form ? 'OUI' : 'NON');
    });
  }

  // Soumission du formulaire
  console.log('✅ Écouteur submit attaché au formulaire');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('🔍 Validation du formulaire...');

    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const formMessage = document.getElementById('form-message');

    // Validation manuelle de tous les champs obligatoires
    const requiredFields = contactForm.querySelectorAll('[required]');
    let firstInvalid = null;
    let invalidCount = 0;

    console.log(`📋 ${requiredFields.length} champs obligatoires trouvés`);

    for (const field of requiredFields) {
      // Vérifier si le champ est visible (pour gérer particulier/entreprise)
      if (field.offsetParent === null) {
        console.log(`⏭️ Champ ${field.name} ignoré (caché)`);
        continue;
      }

      const isEmpty = !field.value || !field.value.trim();
      const isInvalidEmail = field.type === 'email' && field.value && !field.validity.valid;

      if (isEmpty) {
        console.log(`❌ Champ ${field.name} est vide`);
        field.classList.add('invalid');
        invalidCount++;
        if (!firstInvalid) {
          firstInvalid = field;
        }
      } else if (isInvalidEmail) {
        console.log(`❌ Email ${field.name} invalide`);
        field.classList.add('invalid');
        invalidCount++;
        if (!firstInvalid) {
          firstInvalid = field;
        }
      } else {
        console.log(`✅ Champ ${field.name} valide`);
        field.classList.remove('invalid');
      }
    }

    // Si un champ est invalide, afficher un message et bloquer
    if (firstInvalid) {
      console.log(`🛑 ${invalidCount} champ(s) invalide(s) - Blocage de l'envoi`);
      formMessage.style.display = 'block';
      formMessage.className = 'form-message error';
      formMessage.textContent = 'Veuillez remplir tous les champs obligatoires.';
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    console.log('✅ Tous les champs sont valides - Envoi en cours...');

    // Désactiver le bouton
    submitBtn.disabled = true;
    submitText.textContent = 'Envoi en cours...';
    formMessage.style.display = 'none';

    // Récupérer les données du formulaire
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    // Ajouter les données de l'organisme au payload
    data.organism = {
      nomOrganisme: organismData?.nomOrganisme || 'Notre organisme',
      logoUrl: organismData?.logoUrl || '',
      couleurPrincipale: organismData?.couleurPrincipale || '#DC2626',
      telephone: organismData?.telephone || '',
      email: organismData?.email || '',
      emailDestination: organismData?.emailDestination || organismData?.email || '',
      adresse: organismData?.adresse || ''
    };

    try {
      // Envoyer la requête vers le serveur PHP
      const response = await fetch('../../source/send-email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // Fermer la modale de formulaire
        closeContactModal();

        // Réinitialiser le formulaire
        contactForm.reset();

        // Afficher la modale de succès
        const successModal = document.getElementById('success-modal');
        const successMessageText = document.getElementById('success-message-text');
        successMessageText.textContent = result.message;
        successModal.showModal();
      } else {
        // Afficher le message d'erreur dans le formulaire
        formMessage.style.display = 'block';
        formMessage.className = 'form-message error';
        formMessage.textContent = result.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    } catch (error) {
      formMessage.style.display = 'block';
      formMessage.className = 'form-message error';
      formMessage.textContent = 'Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.';
      console.error('Erreur:', error);
    } finally {
      // Réactiver le bouton
      submitBtn.disabled = false;
      submitText.textContent = 'Envoyer';
    }
  });
}

// ============================================
// Bootloader & Configuration Locale
// ============================================

async function checkLocalOverrides() {
  try {
    // 1. Vérifier si un script local existe (surcharge totale)
    // Note: fetch('./script.js') est relatif à la page index.html, donc cherche dans le dossier client
    const scriptResponse = await fetch('./script.local.js', { method: 'HEAD' });
    if (scriptResponse.ok && scriptResponse.status !== 404) {
      console.log('⚡️ Surcharge détectée: Chargement du script local...');

      // On crée dynamiquement la balise script pour charger le fichier local
      const script = document.createElement('script');
      script.src = './script.local.js';
      script.defer = true;
      document.body.appendChild(script);

      // On retourne true pour signaler qu'il faut arrêter le script par défaut
      return true;
    }
  } catch (e) {
    // Ignorer les erreurs (fichier non trouvé, cors, etc.)
  }

  try {
    // 2. Vérifier si un style local existe (surcharge visuelle)
    const styleResponse = await fetch('./style.css', { method: 'HEAD' });
    if (styleResponse.ok && styleResponse.status !== 404) {
      console.log('🎨 Style local détecté: Injection de ./style.css');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './style.css';
      document.head.appendChild(link);
    }
  } catch (e) {
    // Ignorer
  }

  try {
    // 3. Charger la configuration locale (local.json)
    const configResponse = await fetch('./local.json');
    if (configResponse.ok && configResponse.status !== 404) {
      localConfig = await configResponse.json();
      console.log('⚙️ Configuration locale chargée:', localConfig);
    }
  } catch (e) {
    // Ignorer
  }

  return false; // Continuer l'exécution normale
}

// ============================================
// Gestion des Pages Personnalisées & Menu
// ============================================

async function handleLocalConfig() {
  if (!localConfig) return;

  // 1. Injecter les pages dans le menu et le footer
  if (localConfig.pages && Array.isArray(localConfig.pages)) {
    injectCustomMenuItems();
  }

  // 2. Gérer la page d'accueil personnalisée
  if (localConfig.homePage) {
    const homeView = document.getElementById('home-view');
    if (!homeView) {
      throw new Error('Le conteneur #home-view est introuvable dans le DOM. Veuillez vérifier index.html.');
    }

    console.log('Loading custom homepage:', localConfig.homePage);
    await loadCustomPage('home', localConfig.homePage, 'home-view');

    // Afficher la vue accueil par défaut au lieu du catalogue
    toggleCustomView('home-view', false);
    history.replaceState({ viewId: 'home-view' }, '', '/');
    return true; // Indique qu'une page d'accueil custom a été chargée
  }

  return false;
}

// Injecter les items de menu personnalisés
function injectCustomMenuItems() {
  // On attend que injectOrganismInfo ait généré le header/footer de base
  // Cette fonction sera appelée après injectOrganismInfo

  const headerNav = document.querySelector('#header nav ul'); // Sélecteur hypothétique, à adapter selon injectOrganismInfo
  // Note: Comme injectOrganismInfo reconstruit tout le header, nous devrons
  // modifier injectOrganismInfo pour prendre en compte localConfig.
}

// Charger une page HTML externe
async function loadCustomPage(slug, fileUrl, targetContainerId) {
  const container = document.getElementById(targetContainerId);
  if (!container) {
    // Si le conteneur n'existe pas (ex: pour une page générique), on le crée
    if (targetContainerId === 'custom-page-container') {
      let dynamicContainer = document.getElementById('custom-page-view');
      if (!dynamicContainer) {
        dynamicContainer = document.createElement('div');
        dynamicContainer.id = 'custom-page-view';
        dynamicContainer.className = 'hidden';
        document.querySelector('main').appendChild(dynamicContainer);
      }
      // On utilise ce conteneur
      container = dynamicContainer;
    } else {
      return;
    }
  }

  try {
    const response = await fetch(fileUrl, { cache: 'no-store' });
    if (response.ok) {
      const html = await response.text();
      container.innerHTML = html;
      customPagesCache[slug] = true;
      
      // Injecter dynamiquement les stats (ex: page d'accueil custom TARMAC Aerosave)
      const rateElement = container.querySelector('#dynamic-success-rate');
      const dateElement = container.querySelector('#dynamic-success-date');
      
      if (rateElement && typeof formationsData !== 'undefined' && formationsData && formationsData.length > 0) {
        let totalRate = 0;
        let countRate = 0;
        formationsData.forEach(f => {
          if (f.resultats && f.resultats.reussite && !isNaN(parseFloat(f.resultats.reussite))) {
            totalRate += parseFloat(f.resultats.reussite);
            countRate++;
          }
        });
        const avgRate = countRate > 0 ? Math.round(totalRate / countRate) : 0;
        rateElement.innerText = avgRate > 0 ? avgRate : '--';
        
        if (dateElement) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          dateElement.innerText = yesterday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      }
      
    } else {
      console.error(`Erreur chargement page ${slug}: ${response.status}`);
      container.innerHTML = `<div class="p-8 text-center text-red-600">Erreur lors du chargement de la page.</div>`;
    }
  } catch (e) {
    console.error(`Exception chargement page ${slug}:`, e);
    container.innerHTML = `<div class="p-8 text-center text-red-600">Erreur lors du chargement de la page.</div>`;
  }
}

// Afficher une vue personnalisée
// Mapping viewId → chemin URL
const VIEW_URLS = {
  'home-view': '/',
  'catalogue-view': '/catalogue',
  'calendrier-view': '/calendrier',
};

function toggleCustomView(viewId, pushUrl = true) {
  // Masquer toutes les vues connues
  const views = [
    'home-view', 'catalogue-view', 'produit-view',
    'calendrier-view', 'session-detail-view', 'indicateurs-view',
    'custom-page-view'
  ];

  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Afficher la vue demandée
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  // Mettre à jour l'URL sans recharger la page
  if (pushUrl) {
    const url = VIEW_URLS[viewId] || null;
    if (url) history.pushState({ viewId }, '', url);
  }
}

// Navigation vers l'accueil
function goToHome() {
  if (localConfig && localConfig.homePage) {
    toggleCustomView('home-view', false);
    history.pushState({ viewId: 'home-view' }, '', '/');
  } else {
    toggleCustomView('catalogue-view', false);
    renderCatalogue(formationsData);
    history.pushState({ viewId: 'catalogue-view' }, '', '/catalogue');
  }
}

// Navigation vers le catalogue
function goToCatalogue() {
  toggleCustomView('catalogue-view', false);
  renderCatalogue(formationsData);
  history.pushState({ viewId: 'catalogue-view' }, '', '/catalogue');
}

function navigateToCatalogue() {
  goToCatalogue();
}

function navigateToSessions() {
  if (sessionsData && sessionsData.length > 0) {
    goToCalendar();
  } else {
    goToHome();
  }
}

// Rechercher une page dans la configuration locale (y compris dans les children)
function findPageConfig(slug) {
  if (!localConfig || !localConfig.pages) return null;

  for (const page of localConfig.pages) {
    if (page.slug === slug) return page;
    if (page.children) {
      const child = page.children.find(c => c.slug === slug);
      if (child) return child;
    }
  }
  return null;
}

// Collecter toutes les pages avec footer: true (y compris children)
function getFooterPages() {
  if (!localConfig || !localConfig.pages) return [];
  const pages = [];
  for (const page of localConfig.pages) {
    if (page.footer && page.file) pages.push(page);
    if (page.children) {
      for (const child of page.children) {
        if (child.footer) pages.push(child);
      }
    }
  }

  // Masquer "qui-sommes-nous" si l'organisme n'a pas explicitement activé la fonctionnalité
  // SAUF si c'est explicitement défini dans localConfig.pages
  const hasLocalQuiSommesNous = localConfig && localConfig.pages && localConfig.pages.some(p => p.slug === 'qui-sommes-nous');
  if (!hasLocalQuiSommesNous && (!organismData || organismData.afficherQuiSommesNous !== true)) {
    return pages.filter(p => p.slug !== 'qui-sommes-nous');
  }

  return pages;
}

// Générer le HTML du menu pour les pages custom
function buildCustomPagesMenuHTML() {
  if (!localConfig || !localConfig.pages) return '';

  let pagesToDisplay = localConfig.pages.filter(p => p.menu);

  // Masquer "qui-sommes-nous" si l'organisme n'a pas explicitement activé la fonctionnalité
  // SAUF si c'est explicitement défini dans localConfig.pages
  const hasLocalQuiSommesNous = localConfig && localConfig.pages && localConfig.pages.some(p => p.slug === 'qui-sommes-nous');
  if (!hasLocalQuiSommesNous && (!organismData || organismData.afficherQuiSommesNous !== true)) {
    pagesToDisplay = pagesToDisplay.filter(p => p.slug !== 'qui-sommes-nous');
    
    // Filtrer également dans les sous-menus éventuels
    pagesToDisplay = pagesToDisplay.map(page => {
      if (page.children) {
        return {
          ...page,
          children: page.children.filter(child => child.slug !== 'qui-sommes-nous')
        };
      }
      return page;
    });
  }

  return pagesToDisplay.map(page => {
    // Cas 1 : Page avec children → dropdown
    if (page.children && page.children.length > 0) {
      return `
        <div class="dropdown">
          <button class="nav-btn dropdown-toggle">
            ${page.label}
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div class="dropdown-menu">
            ${page.children.map(child => `
              <div class="dropdown-item">
                <button class="dropdown-link" onclick="openCustomPage('${child.slug}')">
                  ${child.label}
                </button>
              </div>
            `).join('')}
          </div>
        </div>`;
    }

    // Cas 2 : Page avec style button-outline → bouton avec bordure
    if (page.style === 'button-outline') {
      return `
        <button onclick="openCustomPage('${page.slug}')" class="nav-btn" style="border: 2px solid hsl(var(--primary)); color: hsl(var(--primary)); font-weight: 600;">
          ${page.label}
        </button>`;
    }

    // Cas 3 : Page simple → bouton plat (comportement actuel)
    return `
      <button onclick="openCustomPage('${page.slug}')" class="nav-btn">
        ${page.label}
      </button>`;
  }).join('');
}

// Ouvrir une page personnalisée (depuis le menu)
async function openCustomPage(slug, pushUrl = true) {
  const pageConfig = findPageConfig(slug);
  if (!pageConfig || !pageConfig.file) return;

  // Créer le conteneur générique s'il n'existe pas
  let container = document.getElementById('custom-page-view');
  if (!container) {
    container = document.createElement('div');
    container.id = 'custom-page-view';
    container.className = 'hidden p-6 max-w-7xl mx-auto';
    document.querySelector('main').appendChild(container);
  }

  await loadCustomPage(slug, pageConfig.file, 'custom-page-view');
  toggleCustomView('custom-page-view', false);

  if (pushUrl) {
    history.pushState({ viewId: 'custom-page-view', slug }, '', `/${slug}`);
  }
}

// Router : naviguer vers la vue correspondant au pathname
async function handleInitialRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/' || path === '') return false;

  if (path === '/catalogue') {
    toggleCustomView('catalogue-view', false);
    renderCatalogue(formationsData);
    return true;
  }

  if (path === '/calendrier') {
    toggleCustomView('calendrier-view', false);
    renderCalendrierView();
    return true;
  }

  // Page custom (ex: /notre-centre-de-formation)
  const slug = path.replace(/^\//, '');
  const pageConfig = findPageConfig(slug);
  if (pageConfig && pageConfig.file) {
    await openCustomPage(slug, false);
    return true;
  }

  // URL inconnue → accueil
  goToHome();
  return true;
}

// Gestion du bouton retour/avance du navigateur
async function handlePopState(event) {
  const state = event.state;

  // Ne jamais appeler pushState/goToHome ici — on est dans un événement popstate,
  // le navigateur gère déjà l'URL. On affiche juste la bonne vue.
  if (!state || state.viewId === 'home-view') {
    if (localConfig && localConfig.homePage) {
      toggleCustomView('home-view', false);
    } else {
      toggleCustomView('catalogue-view', false);
      renderCatalogue(formationsData);
    }
    return;
  }

  if (state.viewId === 'custom-page-view' && state.slug) {
    await openCustomPage(state.slug, false);
  } else if (state.viewId === 'catalogue-view') {
    toggleCustomView('catalogue-view', false);
    renderCatalogue(formationsData);
  } else if (state.viewId === 'calendrier-view') {
    toggleCustomView('calendrier-view', false);
    renderCalendrierView();
  }
}

// Initialisation de l'application
async function init() {
  try {
    // 0. Bootloader : Vérifier les surcharges locales
    const stopExecution = await checkLocalOverrides();
    if (stopExecution) {
      console.log('🛑 Arrêt du script par défaut (relais passé au script local)');
      return;
    }

    // 1. Charger les données en premier
    await loadData();

    // 2. Injecter la couleur principale AVANT de créer les modales
    if (organismData && organismData.couleurPrincipale) {
      document.documentElement.style.setProperty('--primary', hexToHSL(organismData.couleurPrincipale));
    }

    // 3. Créer les modales (maintenant la couleur est déjà injectée)
    createModals();

    // 4. Initialiser les event listeners du formulaire
    initFormListeners();

    // 5. Injecter les informations de l'organisme
    injectOrganismInfo(); // Cette fonction doit maintenant inclure les liens custom

    // 6. Gérer la configuration locale (Pages custom / Accueil)
    console.log('🚀 Checking local config...');
    const customHomeLoaded = await handleLocalConfig();
    console.log('🏠 Custom home loaded?', customHomeLoaded);

    // 7. Router : naviguer vers la vue correspondant à l'URL courante
    const routed = await handleInitialRoute();

    // 8. Afficher le catalogue (seulement si pas de home custom et pas de route détectée)
    if (!customHomeLoaded && !routed) {
      console.log('📋 Rendering catalogue...');
      renderCatalogue(formationsData);
    }

    // 9. Gestion du bouton retour/avance
    window.addEventListener('popstate', handlePopState);

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    // Afficher l'erreur à l'utilisateur pour le débogage
    const errorContainer = document.getElementById('catalogue-view') || document.body;
    errorContainer.innerHTML = `
      <div class="card bg-red-50 border-red-200 m-4">
        <div class="card-content p-6 text-red-700">
          <h3 class="font-bold text-lg mb-2">Erreur d'initialisation</h3>
          <p class="mb-2">Une erreur est survenue lors du chargement de l'application :</p>
          <pre class="bg-white p-2 rounded border text-sm overflow-auto">${error.message}\n${error.stack}</pre>
        </div>
      </div>
    `;
    // Force visibility
    if (errorContainer.classList.contains('hidden')) errorContainer.classList.remove('hidden');
  }
}

// Charger les données depuis les fichiers JSON
async function loadData() {
  try {
    // Charger organism.json
    const organismResponse = await fetch('./organism.json');
    organismData = await organismResponse.json();

    let hasRealFormations = false;
    let hasRealSessions = false;

    // Charger export_formation.json
    try {
      const formationsResponse = await fetch('./export_formation.json');
      const rawFormations = await formationsResponse.json();

      // Mapper et nettoyer les données des formations
      formationsData = mapAndCleanData(rawFormations);

      // Vérifier si on a des formations éligibles
      hasRealFormations = formationsData.length > 0;

      if (hasRealFormations) {
        console.log(`✅ ${formationsData.length} formations réelles chargées`);
      }
    } catch (formationError) {
      console.warn('⚠️ Fichier export_formation.json non trouvé ou vide');
      formationsData = [];
    }

    // Charger export_session.json
    try {
      const sessionsResponse = await fetch('./export_session.json');
      const rawSessions = await sessionsResponse.json();

      // Filtrer et mapper les sessions
      const result = filterAndMapSessions(rawSessions, formationsData);
      sessionsData = result.sessions;

      hasRealSessions = sessionsData.length > 0;

      if (hasRealSessions) {
        console.log(`✅ ${sessionsData.length} sessions valides chargées`);
        if (result.stats) {
          console.log(`   - ${result.stats.byCode} sessions liées par code_produit`);
          console.log(`   - ${result.stats.byName} sessions liées par nom`);
        }
      }
    } catch (sessionError) {
      console.warn('⚠️ Fichier export_session.json non trouvé ou vide');
      sessionsData = [];
    }

    // Gérer les différents cas selon moduladmin et disponibilité des données
    if (organismData && organismData.moduladmin === false) {
      // MODE DÉMO
      if (hasRealFormations && hasRealSessions) {
        // Cas 1: Données réelles disponibles → Limiter à 1 produit et 1 session
        applyDemoMode();
      } else {
        // Cas 2: Pas de données réelles → Utiliser 4 produits et 4 sessions fictifs
        applyFictiveData('demo');
      }
    } else {
      // MODE NORMAL
      if (!hasRealFormations) {
        // Cas 3: Pas de produits réels → Utiliser 4 produits et 4 sessions fictifs
        applyFictiveData('normal');
      }
      // Sinon: Données réelles disponibles, on ne fait rien (comportement normal)
      // Note: Si produits réels mais pas de sessions, c'est un cas normal d'utilisation
    }

  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    throw error;
  }
}

// Appliquer le mode démo : limiter à 1 produit et 1 session (données réelles)
function applyDemoMode() {
  console.log('🎭 Mode démo activé - Limitation à 1 produit et 1 session (données réelles)');

  // Si on a des sessions, prendre une session aléatoire et son produit correspondant
  if (sessionsData.length > 0) {
    // Sélectionner une session aléatoire
    const randomSessionIndex = Math.floor(Math.random() * sessionsData.length);
    const selectedSession = sessionsData[randomSessionIndex];
    sessionsData = [selectedSession];

    // Trouver le produit correspondant à cette session
    const correspondingProduct = formationsData.find(f =>
      f.reference === selectedSession.code_produit ||
      f.code_produit === selectedSession.code_produit ||
      f.titre.toLowerCase() === selectedSession.libelle_produit.toLowerCase()
    );

    if (correspondingProduct) {
      formationsData = [correspondingProduct];
      console.log(`   ✓ Session sélectionnée: ${selectedSession.reference}`);
      console.log(`   ✓ Produit correspondant: ${correspondingProduct.titre}`);
    } else {
      // Si pas de produit correspondant trouvé, prendre un produit aléatoire
      const randomProductIndex = Math.floor(Math.random() * formationsData.length);
      formationsData = [formationsData[randomProductIndex]];
      console.log(`   ⚠️ Aucun produit correspondant trouvé, produit aléatoire sélectionné`);
    }
  } else if (formationsData.length > 0) {
    // Si pas de sessions, prendre un produit aléatoire
    const randomProductIndex = Math.floor(Math.random() * formationsData.length);
    formationsData = [formationsData[randomProductIndex]];
    console.log(`   ✓ Produit aléatoire sélectionné: ${formationsData[0].titre}`);
  }
}

// Appliquer les données fictives (8 produits et 8 sessions)
function applyFictiveData(mode) {
  const fictiveData = getFictiveData();

  if (mode === 'demo') {
    console.log('🎭 Mode démo - Utilisation de 8 produits et 8 sessions fictifs');
  } else {
    console.log('📦 Mode normal - Utilisation de 8 produits et 8 sessions fictifs (aucune donnée réelle)');
  }

  // Charger les 8 produits fictifs
  formationsData = mapAndCleanData(fictiveData.formations);

  // Charger les 8 sessions fictives
  const result = filterAndMapSessions(fictiveData.sessions, formationsData);
  sessionsData = result.sessions;

  // Marquer qu'on utilise des données fictives
  usingFictiveData = true;

  console.log(`   ✓ ${formationsData.length} produits fictifs chargés`);
  console.log(`   ✓ ${sessionsData.length} sessions fictives chargées`);
}

// Filtrer et mapper les sessions selon les règles métier
function filterAndMapSessions(rawSessions, formations) {
  if (!rawSessions || rawSessions.length === 0) {
    return { sessions: [], stats: { byCode: 0, byName: 0 } };
  }

  // Créer deux Maps pour le matching : par code_produit et par nom
  const formationsByCode = new Map();
  const formationsByName = new Map();

  formations.forEach(formation => {
    // Map par code_produit (si existe)
    if (formation.reference && formation.reference !== 'N/A' && formation.reference !== '') {
      formationsByCode.set(formation.reference, formation);
    }
    // Map par nom exact (titre)
    if (formation.titre) {
      formationsByName.set(formation.titre.trim().toLowerCase(), formation);
    }
  });

  // Date actuelle pour comparer
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Début de la journée

  // Statistiques de matching
  const stats = { byCode: 0, byName: 0 };

  // Filtrer les sessions selon les critères
  const filteredSessions = rawSessions.filter(session => {
    // 1. Vérifier que le statut est PRÉVISIONNEL ou CONFIRMÉ
    const statut = session.statut?.toUpperCase();
    if (statut !== 'PRÉVISIONNEL' && statut !== 'CONFIRMÉ') {
      return false;
    }

    // 2. Vérifier que la publication sur le site web est activée
    if (session.publication_session_site_web !== true) {
      return false;
    }

    // 3. Vérifier que la date J1 est dans le futur (session pas encore commencée)
    if (!session.j1) {
      return false;
    }
    const sessionDate = new Date(session.j1);
    sessionDate.setHours(0, 0, 0, 0);
    if (sessionDate < now) {
      return false;
    }

    // 4. Vérifier que la session correspond à une formation valide
    // Tentative 1 : par code_produit
    let formationFound = false;
    let matchMethod = null;

    if (session.code_produit && formationsByCode.has(session.code_produit)) {
      formationFound = true;
      matchMethod = 'code';
    }

    // Tentative 2 : par nom exact du produit (si code_produit ne fonctionne pas)
    if (!formationFound && session.libelleproduit) {
      const sessionName = session.libelleproduit.trim().toLowerCase();
      if (formationsByName.has(sessionName)) {
        formationFound = true;
        matchMethod = 'name';
      }
    }

    if (!formationFound) {
      return false;
    }

    // Incrémenter les stats
    if (matchMethod === 'code') {
      stats.byCode++;
    } else if (matchMethod === 'name') {
      stats.byName++;
    }

    return true;
  });

  // Mapper les sessions filtrées
  const sessions = filteredSessions.map(session => {
    return {
      reference: cleanValue(session.reference, 'N/A'),
      code_produit: cleanValue(session.code_produit, 'N/A'),
      libelle_produit: cleanValue(session.libelleproduit, 'Formation'),
      statut: cleanValue(session.statut, 'PRÉVISIONNEL'),
      date_debut: session.j1,
      date_fin: session.jdernier,
      lieu_formation: cleanValue(session.lieu_formation, ''),
      ville: cleanValue(session.ville, ''),
      code_postal: cleanValue(session.code_postale, ''),
      modalite: cleanValue(session.libellemodalite, 'Présentiel'),
      duree_jours: cleanValue(session.session_duree_jours, ''),
      duree_heures: cleanValue(session.session_duree_heures, ''),
      effectif_max: cleanValue(session.effectif_maxi, 0),
      places_disponibles: cleanValue(session.nbdispo_preinscrit, 0),
      intervenant: cleanValue(session.nom_intervenant, ''),
      publication_places: session.publication_places_site_web === true
    };
  });

  return { sessions, stats };
}

// Fonction utilitaire pour nettoyer les valeurs null
function cleanValue(value, defaultValue = '') {
  if (value === null || value === undefined || value === 'null' || value === 'NULL') {
    return defaultValue;
  }
  return value;
}

// Mapper et nettoyer les données des formations
function mapAndCleanData(rawFormations) {
  // Filtrer uniquement les formations actives et publiées sur le site web
  const filteredFormations = rawFormations.filter(formation => {
    return formation.actif === true && formation.publication_site_web === true;
  });

  return filteredFormations.map(formation => {
    return {
      id: cleanValue(formation.reference, 'N/A'),
      titre: cleanValue(formation.libelle, 'Formation sans titre'),
      categorie: cleanValue(formation.produit_secteur, 'Autres formations'),
      famille: cleanValue(formation.produit_famille, 'Non classé'),
      groupe: cleanValue(formation.produit_groupe, 'Non classé'),
      duree_heures: cleanValue(formation.duree_heure, 'Non spécifiée'),
      duree_jours: cleanValue(formation.duree_jour, null),
      prix: {
        apprenant: cleanValue(formation.prix_apprenant),
        groupe: cleanValue(formation.prix_groupe)
      },
      reference: cleanValue(formation.reference, 'N/A'),
      code_produit: cleanValue(formation.code_produit, null),
      objectifs: formation.objectif_formation && cleanValue(formation.objectif_formation) ? formation.objectif_formation.split('\n').filter(obj => obj.trim()) : [],
      publicConcerne: cleanValue(formation.public_vise, 'Tout public'),
      prerequis: formation.prerequis && cleanValue(formation.prerequis) ? formation.prerequis.split('|').filter(pre => pre.trim()) : ['Aucun'],
      modalites: {
        deroulement: cleanValue(formation.deroulement_formation, 'Information non disponible'),
        methodes_et_moyens: cleanValue(formation.methode_mobilisation, 'Information non disponible')
      },
      accessibiliteHandicap: cleanValue(formation.acces_handi, 'Merci de nous contacter pour plus d\'informations sur l\'accessibilité'),
      programme: cleanValue(formation.programme, '<p>Programme non disponible</p>'),
      evaluation: formation.controle_connaissance && cleanValue(formation.controle_connaissance) ? formation.controle_connaissance.split('|').filter(item => item.trim()) : [],
      avis: {
        intervenant: parsePercentage(cleanValue(formation.satisfaction_intervenant, '0')),
        pedagogie: parsePercentage(cleanValue(formation.satisfaction_pedagogie, '0')),
        contenu: parsePercentage(cleanValue(formation.satisfaction_contenu, '0')),
        objectifs: parsePercentage(cleanValue(formation.satisfaction_obj, '0'))
      },
      resultats: {
        participation: parsePercentage(cleanValue(formation.taux_presence, '0')),
        reussite: parsePercentage(cleanValue(formation.reussite, '0'))
      },
      certification: {
        estCertifiante: cleanValue(formation.formation_certifiante) === 'Oui',
        url: cleanValue(formation.url, '')
      },
      cpf: cleanValue(formation.cpf) === 'Oui' || cleanValue(formation.cpf) === true
    };
  });
}

// Parser les pourcentages
function parsePercentage(value) {
  if (!value) return 0;
  const match = value.toString().match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Calculer la luminance relative d'une couleur (WCAG)
function getLuminance(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

// Calculer le ratio de contraste entre deux couleurs (WCAG)
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Déterminer automatiquement si le texte doit être blanc ou noir
function getContrastColor(backgroundColor) {
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');
  // WCAG recommande un ratio minimum de 4.5:1 pour le texte normal
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

// Convertir HEX en HSL pour CSS variables
function hexToHSL(hex) {
  // Supprimer le # si présent
  hex = hex.replace('#', '');

  // Convertir en RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

// Construire la hiérarchie Secteur > Famille > Groupe
function buildHierarchy(formations) {
  const hierarchy = {};
  let hasAnyHierarchy = false;

  formations.forEach(formation => {
    // Utiliser les valeurs brutes, sans valeur par défaut
    const secteur = formation.categorie;
    const famille = formation.famille;
    const groupe = formation.groupe;

    // Si au moins un champ hiérarchique existe, on a une hiérarchie
    if (secteur || famille || groupe) {
      hasAnyHierarchy = true;

      // Utiliser des valeurs par défaut seulement si nécessaire
      const secteurKey = secteur || 'Non classé';
      const familleKey = famille || 'Non classé';
      const groupeKey = groupe || 'Non classé';

      if (!hierarchy[secteurKey]) {
        hierarchy[secteurKey] = {};
      }
      if (!hierarchy[secteurKey][familleKey]) {
        hierarchy[secteurKey][familleKey] = new Set();
      }
      hierarchy[secteurKey][familleKey].add(groupeKey);
    }
  });

  // Convertir les Sets en tableaux
  Object.keys(hierarchy).forEach(secteur => {
    Object.keys(hierarchy[secteur]).forEach(famille => {
      hierarchy[secteur][famille] = Array.from(hierarchy[secteur][famille]).sort();
    });
  });

  return { hierarchy, hasAnyHierarchy };
}

// Vérifier si la hiérarchie est vide ou insignifiante
function isHierarchyEmpty(hierarchyData) {
  if (!hierarchyData || !hierarchyData.hasAnyHierarchy) {
    return true;
  }

  const { hierarchy } = hierarchyData;
  const secteurs = Object.keys(hierarchy);

  // Si aucun secteur, c'est vide
  if (secteurs.length === 0) {
    return true;
  }

  // Si un seul secteur "Non classé" avec une seule famille "Non classé" et un seul groupe "Non classé"
  if (secteurs.length === 1 && secteurs[0] === 'Non classé') {
    const familles = Object.keys(hierarchy['Non classé']);
    if (familles.length === 1 && familles[0] === 'Non classé') {
      const groupes = hierarchy['Non classé']['Non classé'];
      if (groupes.length === 1 && groupes[0] === 'Non classé') {
        return true;
      }
    }
  }

  return false;
}

// Générer un item de menu avec gestion intelligente des niveaux "Non classé"
function buildMenuItemHTML(secteur, famille, groupe, hierarchy) {
  // Si le secteur est "Non classé", on ne l'affiche pas du tout
  if (secteur === 'Non classé') {
    return '';
  }

  const familles = Object.keys(hierarchy[secteur]).sort();

  // Si toutes les familles sont "Non classé", on affiche juste le secteur comme item terminal
  const hasOnlyNonClasseFamille = familles.length === 1 && familles[0] === 'Non classé';

  if (hasOnlyNonClasseFamille) {
    return `
      <div class="dropdown-item" data-type="secteur" data-value="${secteur.replace(/"/g, '&quot;')}">
        <div class="dropdown-link">
          ${secteur}
        </div>
      </div>
    `;
  }

  // Sinon, on construit normalement avec les sous-menus
  return `
    <div class="dropdown-item has-submenu" data-type="secteur" data-value="${secteur.replace(/"/g, '&quot;')}">
      <div class="dropdown-link">
        ${secteur}
        <svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
      
      <div class="dropdown-submenu">
        ${familles.map(famille => buildFamilleMenuItemHTML(secteur, famille, hierarchy)).join('')}
      </div>
    </div>
  `;
}

// Générer un item de menu pour une famille
function buildFamilleMenuItemHTML(secteur, famille, hierarchy) {
  // Si la famille est "Non classé", on ne l'affiche pas
  if (famille === 'Non classé') {
    return '';
  }

  const groupes = hierarchy[secteur][famille];

  // Si tous les groupes sont "Non classé", on affiche juste la famille comme item terminal
  const hasOnlyNonClasseGroupe = groupes.length === 1 && groupes[0] === 'Non classé';

  if (hasOnlyNonClasseGroupe) {
    return `
      <div class="dropdown-item" data-type="famille" data-value="${famille.replace(/"/g, '&quot;')}">
        <div class="dropdown-link">
          ${famille}
        </div>
      </div>
    `;
  }

  // Sinon, on construit avec les groupes
  return `
    <div class="dropdown-item has-submenu" data-type="famille" data-value="${famille.replace(/"/g, '&quot;')}">
      <div class="dropdown-link">
        ${famille}
        <svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
      
      <div class="dropdown-submenu">
        ${groupes.filter(g => g !== 'Non classé').map(groupe => `
          <div class="dropdown-item" data-type="groupe" data-value="${groupe.replace(/"/g, '&quot;')}">
            <div class="dropdown-link">
              ${groupe}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Injecter les informations de l'organisme
function injectOrganismInfo() {
  if (!organismData) return;

  // Log pour vérifier le mode démo
  if (organismData.moduladmin === false) {
    console.log('🎭 Mode démo - Nombre de formations pour le menu:', formationsData.length);
  }

  // Construire la hiérarchie pour le menu
  const hierarchyData = buildHierarchy(formationsData);
  const { hierarchy } = hierarchyData;
  const showCatalogueMenu = !isHierarchyEmpty(hierarchyData);

  console.log('📊 Hiérarchie:', {
    secteurs: Object.keys(hierarchy).length,
    showMenu: showCatalogueMenu
  });

  // Header avec navigation
  const header = document.getElementById('header');
  if (header) {
    header.innerHTML = `
      <div class="container mx-auto px-4 py-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            ${organismData.logoUrl ? `<img src="${organismData.logoUrl}" alt="Logo" class="h-20 cursor-pointer" onclick="goToHome()">` : ''}
          </div>
          
          <!-- Navigation -->
          <nav class="flex items-center gap-2">
            ${(organismData.afficherAccueil === true || (typeof localConfig !== 'undefined' && localConfig && localConfig.homePage)) ? `
            <button onclick="goToHome()" class="nav-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Accueil
            </button>` : ''}
            
            ${showCatalogueMenu ? `<div class="dropdown">
              <button class="nav-btn dropdown-toggle" onclick="goToCatalogue()">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
                Catalogue
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <div class="dropdown-menu">
                ${Object.keys(hierarchy).sort().map(secteur => buildMenuItemHTML(secteur, null, null, hierarchy)).join('')}
              </div>
            </div>` : ''}
            
            ${sessionsData.length > 0 ? `
            <button onclick="goToCalendar()" class="nav-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Calendrier
            </button>
            ` : ''}
            
            ${buildCustomPagesMenuHTML()}
          </nav>
        </div>
      </div>
    `;
  }

  // Footer
  const footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <!-- Informations de l'organisme -->
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem; background: hsl(var(--muted) / 0.3); border-radius: 0.75rem; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            <span style="font-weight: 600; color: hsl(var(--foreground));">${organismData.nomOrganisme}</span>
          </div>
          ${organismData.adresse ? `
            <span style="color: hsl(var(--muted-foreground));">•</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span style="color: hsl(var(--foreground)); font-size: 0.875rem;">${organismData.adresse}</span>
            </div>
          ` : ''}
          ${organismData.telephone ? `
            <span style="color: hsl(var(--muted-foreground));">•</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <a href="tel:${organismData.telephone}" style="color: hsl(var(--foreground)); font-size: 0.875rem; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='hsl(var(--primary))'" onmouseout="this.style.color='hsl(var(--foreground))'">${organismData.telephone}</a>
            </div>
          ` : ''}
          ${organismData.email ? `
            <span style="color: hsl(var(--muted-foreground));">•</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <a href="mailto:${organismData.email}" style="color: hsl(var(--foreground)); font-size: 0.875rem; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='hsl(var(--primary))'" onmouseout="this.style.color='hsl(var(--foreground))'">${organismData.email}</a>
            </div>
          ` : ''}
        </div>
        
        <!-- Crédit Argalis -->
        <div style="text-align: center; padding: 1rem; border-top: 1px solid hsl(var(--border));">
          <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground));">
            Site web propulsé par 
            <a href="https://argalis.fr" target="_blank" rel="noopener noreferrer" style="color: hsl(var(--primary)); font-weight: 600; text-decoration: none; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Argalis</a>
            - Solution de gestion pour les organismes de formation
          </p>
          
          <!-- Liens pages custom (Footer) + CGV -->
          <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem;">
            ${(() => {
              const footerPages = getFooterPages();
              return footerPages.map(page => `
                <button onclick="openCustomPage('${page.slug}')" style="color: hsl(var(--muted-foreground)); font-size: 0.875rem; transition: color 0.2s;" onmouseover="this.style.color='hsl(var(--primary))'" onmouseout="this.style.color='hsl(var(--muted-foreground))'">
                  ${page.label}
                </button>
              `).join('');
            })()}
            <a href="./Documents/CGV Formation MAR22.pdf" target="_blank" rel="noopener noreferrer" style="color: hsl(var(--muted-foreground)); font-size: 0.875rem; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='hsl(var(--primary))'" onmouseout="this.style.color='hsl(var(--muted-foreground))'">
              Nos CGV
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Initialiser les événements des sous-menus
  initSubmenuEvents();

  // Afficher le bandeau selon le mode et l'utilisation de données fictives
  if (organismData.moduladmin === false && usingFictiveData) {
    // Mode démo avec données fictives
    showDemoBanner('demo-fictive');
  } else if (organismData.moduladmin === false) {
    // Mode démo avec données réelles
    showDemoBanner('demo-real');
  } else if (usingFictiveData) {
    // Mode normal avec données fictives
    showDemoBanner('normal-fictive');
  }
  // Sinon: mode normal avec données réelles, pas de bandeau
}

// Afficher le bandeau de démo ou d'information
function showDemoBanner(type) {
  const demoBanner = document.getElementById('demo-banner');
  if (!demoBanner) return;

  // Appliquer les styles sticky directement sur le conteneur
  demoBanner.style.cssText = `
    position: sticky;
    top: 0;
    z-index: 9999;
    background: hsl(var(--primary));
    color: white;
    padding: 1rem 0;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    display: block;
  `;

  let message = '';

  if (type === 'demo-fictive') {
    // Mode démo avec données fictives
    message = `
      <p style="margin: 0; font-weight: 600; font-size: 0.95rem;">
        Site de démonstration - Produits et sessions fictifs
      </p>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; opacity: 0.9;">
        Passez au plan <a href="https://www.argalis.fr/tarifs.html" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: white; text-decoration: underline;">Business</a> pour accéder à l'intégralité du catalogue
      </p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.85;">
        Rendez-vous dans votre espace Argalis > Administration > Mon abonnement afin de migrer vers ce plan
      </p>
    `;
  } else if (type === 'demo-real') {
    // Mode démo avec données réelles
    message = `
      <p style="margin: 0; font-weight: 600; font-size: 0.95rem;">
        Site de démonstration - Limité à 1 produit et 1 session
      </p>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; opacity: 0.9;">
        Passez au plan <a href="https://www.argalis.fr/tarifs.html" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: white; text-decoration: underline;">Business</a> pour accéder à l'intégralité du catalogue
      </p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.85;">
        Rendez-vous dans votre espace Argalis > Administration > Mon abonnement afin de migrer vers ce plan
      </p>
    `;
  } else if (type === 'normal-fictive') {
    // Mode normal avec données fictives
    message = `
      <p style="margin: 0; font-weight: 600; font-size: 0.95rem;">
        Données fictives
      </p>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; opacity: 0.9;">
        Activez la publication de vos produits et sessions dans Argalis pour afficher vos propres formations
      </p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.85;">
        Les changements seront visibles sur ce site dès le lendemain.
      </p>
    `;
  }

  demoBanner.innerHTML = `
    <div class="container mx-auto px-4">
      <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap;">
        <div style="text-align: center;">
          ${message}
        </div>
      </div>
    </div>
  `;
}

// Rechercher dans les formations
function searchFormations(formations, query) {
  if (!query || query.trim() === '') {
    return formations;
  }

  const searchTerm = query.toLowerCase().trim();

  return formations.filter(formation => {
    // Recherche dans le titre
    if (formation.titre && formation.titre.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Recherche dans la catégorie
    if (formation.categorie && formation.categorie.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Recherche dans la référence
    if (formation.reference && formation.reference.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Recherche dans les objectifs
    if (formation.objectifs && formation.objectifs.some(obj => obj.toLowerCase().includes(searchTerm))) {
      return true;
    }

    // Recherche dans le public concerné
    if (formation.publicConcerne && formation.publicConcerne.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Recherche dans les prérequis
    if (formation.prerequis && formation.prerequis.some(pre => pre.toLowerCase().includes(searchTerm))) {
      return true;
    }

    // Recherche dans le programme (HTML)
    if (formation.programme && formation.programme.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Recherche dans les modalités
    if (formation.modalites) {
      if (formation.modalites.deroulement && formation.modalites.deroulement.toLowerCase().includes(searchTerm)) {
        return true;
      }
      if (formation.modalites.methodes_et_moyens && formation.modalites.methodes_et_moyens.toLowerCase().includes(searchTerm)) {
        return true;
      }
    }

    // Recherche dans l'évaluation
    if (formation.evaluation && formation.evaluation.some(item => item.toLowerCase().includes(searchTerm))) {
      return true;
    }

    return false;
  });
}

// Afficher le catalogue
function renderCatalogue(formations) {
  // Afficher la vue catalogue via toggleCustomView
  toggleCustomView('catalogue-view', false);

  const catalogueView = document.getElementById('catalogue-view');

  // Appliquer la recherche
  let filteredFormations = searchFormations(formations, searchQuery);

  // Appliquer le filtre hiérarchique (secteur/famille/groupe)
  if (currentHierarchyFilter.type && currentHierarchyFilter.value) {
    if (currentHierarchyFilter.type === 'secteur') {
      filteredFormations = filteredFormations.filter(f => f.categorie === currentHierarchyFilter.value);
    } else if (currentHierarchyFilter.type === 'famille') {
      filteredFormations = filteredFormations.filter(f => f.famille === currentHierarchyFilter.value);
    } else if (currentHierarchyFilter.type === 'groupe') {
      filteredFormations = filteredFormations.filter(f => f.groupe === currentHierarchyFilter.value);
    }
  }

  // Appliquer le filtre de catégorie (boutons de filtre)
  if (currentFilter !== 'all') {
    filteredFormations = filteredFormations.filter(f => f.categorie === currentFilter);
  }

  // Appliquer les filtres avancés
  filteredFormations = applyAdvancedFilters(filteredFormations);

  // Obtenir les catégories uniques (en filtrant les valeurs null/undefined)
  const categories = ['all', ...new Set(formations.map(f => f.categorie).filter(cat => cat && cat !== 'null'))];

  // Générer le HTML
  catalogueView.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-3xl font-bold">Catalogue de formations</h2>
        ${currentHierarchyFilter.type && currentHierarchyFilter.value ? `
          <div class="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
            <span class="text-sm font-medium">
              Filtré par ${currentHierarchyFilter.type === 'secteur' ? 'secteur' : currentHierarchyFilter.type} : 
              <strong class="text-primary">${currentHierarchyFilter.value}</strong>
            </span>
            <button onclick="goToHome()" class="ml-2 p-1 hover:bg-primary/20 rounded" title="Retirer le filtre">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
      
      <!-- Barre de recherche -->
      <div class="mb-8">
        <div class="card" style="background: hsl(var(--primary)); border: none; box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2);">
          <div class="card-content" style="padding: 2rem;">
            <div style="position: relative;">
              <input 
                type="text" 
                id="search-input"
                placeholder="Rechercher une formation (nom, compétences, programme, prérequis...)"
                value="${searchQuery}"
                style="width: 100%; padding: 1rem 1.5rem; padding-left: 3rem; font-size: 1.125rem; border-radius: 0.75rem; border: 2px solid transparent; background-color: white; color: hsl(var(--foreground)); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); transition: all 0.2s ease; outline: none;"
                onkeyup="handleSearch(this.value)"
                onfocus="this.style.borderColor='hsl(var(--primary))'; this.style.boxShadow='0 0 0 3px hsl(var(--primary) / 0.1), 0 4px 6px -1px rgb(0 0 0 / 0.1)';"
                onblur="this.style.borderColor='transparent'; this.style.boxShadow='0 4px 6px -1px rgb(0 0 0 / 0.1)';"
              />
              <svg style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 1.5rem; height: 1.5rem; color: hsl(var(--muted-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              ${searchQuery ? `
                <button 
                  onclick="clearSearch()"
                  style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); padding: 0.25rem; background: hsl(var(--muted)); border-radius: 9999px; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center;"
                  title="Effacer la recherche"
                >
                  <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--muted-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
            ${searchQuery ? `
              <p style="margin-top: 1rem; color: white; font-size: 0.875rem; text-align: center;">
                ${filteredFormations.length} formation${filteredFormations.length > 1 ? 's' : ''} trouvée${filteredFormations.length > 1 ? 's' : ''} pour "${searchQuery}"
              </p>
            ` : ''}
          </div>
        </div>
      </div>
      
      <!-- Filtres Avancés -->
      <div class="mb-8">
        <!-- Bouton toggle filtres -->
        <button 
          onclick="toggleFilters()" 
          class="btn btn-outline mb-4"
          style="display: flex; align-items: center; gap: 0.5rem;"
        >
          <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
          <span>Filtres avancés</span>
          ${getActiveFiltersCount() > 0 ? `<span class="badge badge-default" style="margin-left: 0.25rem;">${getActiveFiltersCount()}</span>` : ''}
        </button>

        <!-- Badges des filtres actifs -->
        <div class="filter-badges-container">
          ${renderActiveFiltersBadges()}
        </div>

        <!-- Panneau de filtres -->
        <div id="filters-panel" style="display: ${showFilters ? 'block' : 'none'};" class="card mb-6">
          <div class="card-content" style="padding: 1.5rem;">
            
            <!-- Hiérarchie en cascade -->
            <div style="margin-bottom: 1.5rem;">
              <h4 style="font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                </svg>
                Catégories
              </h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                <div>
                  <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: hsl(var(--muted-foreground));">Secteur</label>
                  <select onchange="updateFilter('secteur', this.value)" class="w-full" style="padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem;">
                    <option value="">Tous</option>
                    ${getSecteurs().map(s => `<option value="${s}" ${advancedFilters.secteur === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
                ${advancedFilters.secteur ? `
                  <div>
                    <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: hsl(var(--muted-foreground));">Famille</label>
                    <select onchange="updateFilter('famille', this.value)" class="w-full" style="padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem;">
                      <option value="">Toutes</option>
                      ${getFamilles(advancedFilters.secteur).map(f => `<option value="${f}" ${advancedFilters.famille === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                  </div>
                ` : ''}
                ${advancedFilters.secteur && advancedFilters.famille ? `
                  <div>
                    <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: hsl(var(--muted-foreground));">Groupe</label>
                    <select onchange="updateFilter('groupe', this.value)" class="w-full" style="padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem;">
                      <option value="">Tous</option>
                      ${getGroupes(advancedFilters.secteur, advancedFilters.famille).map(g => `<option value="${g}" ${advancedFilters.groupe === g ? 'selected' : ''}>${g}</option>`).join('')}
                    </select>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="separator separator-horizontal" style="margin: 1.5rem 0;"></div>

            <!-- Autres filtres -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
              
              <!-- Filtre Durée avec range slider -->
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 0.75rem; color: hsl(var(--foreground)); display: flex; align-items: center; gap: 0.5rem;">
                  <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Durée
                </label>
                <select onchange="updateFilter('dureeType', this.value)" class="w-full" style="padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem; margin-bottom: 0.75rem;">
                  <option value="heures" ${advancedFilters.dureeType === 'heures' ? 'selected' : ''}>En heures</option>
                  <option value="jours" ${advancedFilters.dureeType === 'jours' ? 'selected' : ''}>En jours</option>
                </select>
                <div id="duree-range-slider"></div>
              </div>

              <!-- Filtre Type de Prix + Budget avec range slider -->
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 0.75rem; color: hsl(var(--foreground)); display: flex; align-items: center; gap: 0.5rem;">
                  <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Budget ${advancedFilters.prixType ? `(par ${advancedFilters.prixType})` : ''}
                </label>
                <select onchange="updateFilter('prixType', this.value)" class="w-full" style="padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem; margin-bottom: 0.75rem;">
                  <option value="">Type de tarif</option>
                  <option value="apprenant" ${advancedFilters.prixType === 'apprenant' ? 'selected' : ''}>Par apprenant</option>
                  <option value="groupe" ${advancedFilters.prixType === 'groupe' ? 'selected' : ''}>Par groupe</option>
                </select>
                <div id="prix-range-slider"></div>
              </div>

              <!-- Filtre Certification -->
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 0.75rem; color: hsl(var(--foreground)); display: flex; align-items: center; gap: 0.5rem;">
                  <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                  </svg>
                  Certification
                </label>
                <select onchange="updateFilter('certifiante', this.value)" class="w-full" style="padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white;">
                  <option value="">Toutes</option>
                  <option value="true" ${advancedFilters.certifiante === 'true' ? 'selected' : ''}>Certifiantes uniquement</option>
                  <option value="false" ${advancedFilters.certifiante === 'false' ? 'selected' : ''}>Non certifiantes</option>
                </select>
              </div>

            </div>
            
            <!-- Le bouton "Réinitialiser les filtres" est géré dynamiquement par updateResetButton() -->
          </div>
        </div>
      </div>
      
      <!-- Grille de formations -->
      ${filteredFormations.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filteredFormations.map(formation => createFormationCard(formation)).join('')}
        </div>
      ` : `
        <div class="flex flex-col items-center justify-center py-16">
          <svg class="w-24 h-24 text-muted-foreground mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="text-2xl font-semibold text-foreground mb-2">Aucune formation disponible</h3>
          <p class="text-muted-foreground text-center max-w-md">
            ${searchQuery ?
      `Aucune formation ne correspond à votre recherche "${searchQuery}". Essayez avec d'autres mots-clés.` :
      currentHierarchyFilter.type ?
        `Aucune formation n'est disponible dans cette catégorie pour le moment.` :
        `Aucune formation n'est disponible pour le moment. Revenez plus tard pour découvrir nos nouvelles offres de formation.`
    }
          </p>
          ${searchQuery || currentHierarchyFilter.type ? `
            <button onclick="goToHome()" class="btn btn-default mt-6">
              Voir toutes les formations
            </button>
          ` : ''}
        </div>
      `}
    </div>
  `;

  // Initialiser les range sliders uniquement si le panneau vient de s'ouvrir
  if (showFilters) {
    const dureeContainer = document.getElementById('duree-range-slider');
    const prixContainer = document.getElementById('prix-range-slider');

    // Vérifier si les conteneurs existent et sont vides (pas encore initialisés)
    // OU si on vient de changer le type de durée (forcer la réinitialisation)
    const needsInit = (dureeContainer && dureeContainer.children.length === 0) ||
      (prixContainer && prixContainer.children.length === 0);

    if (dureeContainer || prixContainer) {
      setTimeout(() => {
        initializeRangeSliders();
        // Afficher le bouton "Réinitialiser" si des filtres sont actifs
        if (typeof updateResetButton === 'function') {
          updateResetButton();
        }
      }, 50);
    }
  }
}

// Mettre à jour uniquement la grille de formations sans toucher aux filtres
function updateFormationsGrid() {
  // Appliquer la recherche
  let filteredFormations = searchFormations(formationsData, searchQuery);

  // Appliquer le filtre hiérarchique
  if (currentHierarchyFilter.type && currentHierarchyFilter.value) {
    if (currentHierarchyFilter.type === 'secteur') {
      filteredFormations = filteredFormations.filter(f => f.categorie === currentHierarchyFilter.value);
    } else if (currentHierarchyFilter.type === 'famille') {
      filteredFormations = filteredFormations.filter(f => f.famille === currentHierarchyFilter.value);
    } else if (currentHierarchyFilter.type === 'groupe') {
      filteredFormations = filteredFormations.filter(f => f.groupe === currentHierarchyFilter.value);
    }
  }

  // Appliquer le filtre de catégorie
  if (currentFilter !== 'all') {
    filteredFormations = filteredFormations.filter(f => f.categorie === currentFilter);
  }

  // Appliquer les filtres avancés
  filteredFormations = applyAdvancedFilters(filteredFormations);

  // Chercher le conteneur de la grille de manière plus robuste
  const catalogueView = document.getElementById('catalogue-view');
  if (!catalogueView) return;

  // Trouver la grille ou son conteneur parent
  let gridContainer = catalogueView.querySelector('.grid');

  if (gridContainer && filteredFormations.length > 0) {
    // Mettre à jour uniquement le contenu de la grille
    gridContainer.innerHTML = filteredFormations.map(formation => createFormationCard(formation)).join('');
  } else if (gridContainer && filteredFormations.length === 0) {
    // Remplacer la grille par le message "aucune formation"
    const parent = gridContainer.parentElement;
    parent.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16">
        <svg class="w-24 h-24 text-muted-foreground mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="text-2xl font-semibold text-foreground mb-2">Aucune formation disponible</h3>
        <p class="text-muted-foreground text-center max-w-md mb-6">
          Aucune formation ne correspond aux critères sélectionnés.
        </p>
        <button onclick="resetFilters()" class="btn btn-default" style="background: hsl(var(--primary)); color: white; padding: 0.75rem 2rem; font-size: 1rem; font-weight: 600;">
          <svg style="width: 1.25rem; height: 1.25rem; display: inline; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Effacer les filtres
        </button>
      </div>
    `;
  }

  console.log(`Grille mise à jour : ${filteredFormations.length} formations affichées`);
}

// Initialiser les range sliders
function initializeRangeSliders() {
  try {
    // Slider de durée
    const dureeContainer = document.getElementById('duree-range-slider');
    if (dureeContainer) {
      // Vider complètement le conteneur
      dureeContainer.innerHTML = '';

      const dureeType = advancedFilters.dureeType || 'heures';
      const dureeRange = getDureeRange(dureeType);

      // TOUJOURS réinitialiser les valeurs à null pour forcer l'utilisation des nouvelles limites
      const currentMinDuree = dureeRange.min;
      const currentMaxDuree = dureeRange.max;

      console.log(`🔄 Initialisation slider durée:`, {
        type: dureeType,
        range: dureeRange,
        currentMin: currentMinDuree,
        currentMax: currentMaxDuree
      });

      // Créer un nouveau slider
      dureeSlider = new RangeSlider(dureeContainer, {
        min: dureeRange.min,
        max: dureeRange.max,
        currentMin: currentMinDuree,
        currentMax: currentMaxDuree,
        step: 1,
        unit: dureeType === 'jours' ? 'j' : 'h',
        onChange: (min, max) => {
          updateDureeSlider(min, max);
        }
      });

      console.log(`✅ Slider de durée créé (${dureeType}): ${dureeRange.min}${dureeType === 'jours' ? 'j' : 'h'} - ${dureeRange.max}${dureeType === 'jours' ? 'j' : 'h'}`);
    }

    // Slider de prix
    const prixContainer = document.getElementById('prix-range-slider');
    if (prixContainer) {
      // Vider le conteneur d'abord
      prixContainer.innerHTML = '';

      const prixRange = getPrixRange(advancedFilters.prixType);
      const currentMinPrix = advancedFilters.prixMin !== null ? advancedFilters.prixMin : prixRange.min;
      const currentMaxPrix = advancedFilters.prixMax !== null ? advancedFilters.prixMax : prixRange.max;

      prixSlider = new RangeSlider(prixContainer, {
        min: prixRange.min,
        max: prixRange.max,
        currentMin: currentMinPrix,
        currentMax: currentMaxPrix,
        step: 50,
        unit: '€',
        onChange: (min, max) => {
          updatePrixSlider(min, max);
        }
      });

      console.log('Slider de prix initialisé');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des sliders:', error);
  }
}

// Créer une carte de formation
function createFormationCard(formation) {
  const prixHTML = getPrixHTMLCard(formation.prix);
  // Hiérarchie : Groupe > Famille > Secteur
  // Ne pas afficher si c'est "Non classé"
  const hierarchyLabel = (formation.groupe && formation.groupe !== 'Non classé') ? formation.groupe :
    (formation.famille && formation.famille !== 'Non classé') ? formation.famille :
      (formation.categorie && formation.categorie !== 'Non classé' && formation.categorie !== 'Autres formations') ? formation.categorie : null;

  return `
    <div class="card formation-card fade-in" onclick="showFormationDetail('${formation.id}')" style="border-left: 3px solid hsl(var(--primary)); transition: all 0.3s ease;">
      <div class="card-header">
        <h3 class="card-title" style="font-size: 1.25rem; margin-bottom: 0.75rem;">${formation.titre}</h3>
        ${hierarchyLabel ? `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
          <span class="badge badge-secondary" style="flex-shrink: 0;">${hierarchyLabel}</span>
          <span style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); font-weight: 600; white-space: nowrap;">${formation.reference}</span>
        </div>
        ` : `<span style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); font-weight: 600; text-align: right; display: block;">${formation.reference}</span>`}
      </div>
      <div class="card-content" style="padding: 1.25rem; padding-top: 0.75rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <!-- Durée -->
          <div style="background: hsl(var(--primary) / 0.05); padding: 0.75rem; border-radius: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span style="font-size: 0.7rem; color: hsl(var(--muted-foreground)); font-weight: 600; text-transform: uppercase;">Durée</span>
            </div>
            <p style="font-size: 0.95rem; font-weight: 700; color: hsl(var(--primary)); margin: 0;">${formatDuree(formation.duree_heures, formation.duree_jours)}</p>
          </div>
          
          <!-- Prix -->
          <div style="background: hsl(var(--muted) / 0.5); padding: 0.75rem; border-radius: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span style="font-size: 0.7rem; color: hsl(var(--foreground)); font-weight: 600; text-transform: uppercase; opacity: 0.7;">Prix</span>
            </div>
            <div style="font-size: 0.85rem;">
              ${prixHTML}
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <button class="btn btn-default" style="width: 100%; font-weight: 600;">Voir les détails</button>
      </div>
    </div>
  `;
}

// Formater la durée avec heures et jours
function formatDuree(duree_heures, duree_jours) {
  // Si la durée en heures est 0h ou vide, afficher n/c
  if (!duree_heures || duree_heures === 'Non spécifiée' || duree_heures === '0h') {
    return 'n/c';
  }

  // Si la durée en jours est 0j, afficher n/c
  if (duree_jours === '0j') {
    return 'n/c';
  }

  // Si on a les deux valeurs valides
  if (duree_jours && duree_jours !== 'null' && duree_jours !== '' && duree_jours !== 'NULL') {
    return `${duree_heures} (${duree_jours})`;
  }

  // Sinon juste les heures
  return duree_heures;
}

// Générer le HTML du prix pour les cards (sans séparateur, justifié à gauche)
function getPrixHTMLCard(prix) {
  const parts = [];

  if (prix.apprenant && prix.apprenant !== 'null' && prix.apprenant !== '' && prix.apprenant !== 'NULL') {
    parts.push(`<div style="font-weight: 700; color: hsl(var(--foreground)); font-size: 0.95rem;">${prix.apprenant} € HT <span style="font-size: 0.7rem; font-weight: 500; color: hsl(var(--muted-foreground));">/ apprenant</span></div>`);
  }

  if (prix.groupe && prix.groupe !== 'null' && prix.groupe !== '' && prix.groupe !== 'NULL') {
    parts.push(`<div style="font-weight: 700; color: hsl(var(--foreground)); font-size: 0.95rem;">${prix.groupe} € HT <span style="font-size: 0.7rem; font-weight: 500; color: hsl(var(--muted-foreground));">/ groupe</span></div>`);
  }

  if (parts.length === 0) {
    return '<div style="font-weight: 600; color: hsl(var(--muted-foreground)); font-size: 0.85rem;">Nous consulter</div>';
  }

  // Afficher les prix les uns sous les autres, justifiés à gauche
  return parts.join('');
}

// Générer le HTML du prix pour les détails (avec séparateur, centré)
function getPrixHTML(prix) {
  const parts = [];

  if (prix.apprenant && prix.apprenant !== 'null' && prix.apprenant !== '' && prix.apprenant !== 'NULL') {
    parts.push(`<span style="font-weight: 700; color: hsl(var(--foreground)); font-size: 0.95rem;">${prix.apprenant} € HT <span style="font-size: 0.7rem; font-weight: 500; color: hsl(var(--muted-foreground));">/ apprenant</span></span>`);
  }

  if (prix.groupe && prix.groupe !== 'null' && prix.groupe !== '' && prix.groupe !== 'NULL') {
    parts.push(`<span style="font-weight: 700; color: hsl(var(--foreground)); font-size: 0.95rem;">${prix.groupe} € HT <span style="font-size: 0.7rem; font-weight: 500; color: hsl(var(--muted-foreground));">/ groupe</span></span>`);
  }

  if (parts.length === 0) {
    return '<div style="font-weight: 600; color: hsl(var(--muted-foreground)); font-size: 0.85rem; text-align: center;">Nous consulter</div>';
  }

  // Si deux prix, les mettre sur la même ligne avec un séparateur
  if (parts.length === 2) {
    return `<div style="display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap;">${parts[0]}<span style="color: hsl(var(--muted-foreground)); font-weight: 300;">|</span>${parts[1]}</div>`;
  }

  return `<div style="text-align: center;">${parts[0]}</div>`;
}

// Filtrer les formations
function filterFormations(category) {
  currentFilter = category;
  renderCatalogue(formationsData);

  // Scroll vers le haut
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Afficher le détail d'une formation
function showFormationDetail(formationId) {
  // Chercher par id (référence PRO) ou par reference (code_produit)
  const formation = formationsData.find(f => f.id === formationId || f.reference === formationId);

  if (!formation) {
    console.error('Formation non trouvée:', formationId, 'Formations disponibles:', formationsData.map(f => ({ id: f.id, reference: f.reference, titre: f.titre })));
    return;
  }

  // Masquer toutes les autres vues, afficher la vue produit
  toggleCustomView('produit-view', false);

  const produitView = document.getElementById('produit-view');

  // Construire le breadcrumb hiérarchique
  const breadcrumbItems = [];

  // Ajouter uniquement les éléments significatifs (pas "Non classé" ou "Autres formations")
  if (formation.categorie &&
    formation.categorie !== 'Non classé' &&
    formation.categorie !== 'Autres formations') {
    breadcrumbItems.push(formation.categorie);
  }

  if (formation.famille && formation.famille !== 'Non classé') {
    breadcrumbItems.push(formation.famille);
  }

  if (formation.groupe && formation.groupe !== 'Non classé') {
    breadcrumbItems.push(formation.groupe);
  }

  // Afficher le breadcrumb uniquement s'il y a au moins un élément significatif
  const breadcrumbHTML = breadcrumbItems.length > 0 ? `
    <nav style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
      ${breadcrumbItems.map((item, index) => `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.875rem; color: ${index === breadcrumbItems.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}; font-weight: ${index === breadcrumbItems.length - 1 ? '600' : '500'};">${item}</span>
          ${index < breadcrumbItems.length - 1 ? `
            <svg style="width: 1rem; height: 1rem; color: hsl(var(--muted-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          ` : ''}
        </div>
      `).join('')}
    </nav>
  ` : '';

  // Générer le HTML de la fiche produit
  produitView.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <!-- Bouton retour -->
      <button class="btn btn-outline mb-6" onclick="backToCatalogue()">
        ← Retour au catalogue
      </button>
      
      <!-- Breadcrumb -->
      ${breadcrumbHTML}
      
      <!-- Titre -->
      <h2 class="text-3xl font-bold mb-6">${formation.titre}</h2>
      
      <!-- Layout 2 colonnes -->
      <div class="grid" style="grid-template-columns: 1fr; gap: 2rem;">
        <style>
          @media (min-width: 1024px) {
            .detail-grid {
              grid-template-columns: 2fr 1fr !important;
            }
          }
        </style>
        <div class="detail-grid" style="display: grid; grid-template-columns: 1fr; gap: 2rem;">
        <!-- Colonne principale (gauche) -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${createObjectifsCard(formation)}
          ${createPublicCard(formation)}
          ${createModalitesCard(formation)}
          ${createAccessibiliteCard(formation)}
          ${createCompetencesCard(formation)}
          ${createProgrammeCard(formation)}
          ${createEvaluationCard(formation)}
          ${createMaintienConnaissancesCard(formation)}
          ${createAvisEtResultatsCard(formation)}
          ${createCertificationCard(formation)}
        </div>
        
        <!-- Colonne latérale (droite) -->
        <div class="sidebar-sticky" style="position: sticky; top: 2rem; align-self: flex-start;">
          <div class="card" style="border-left: 4px solid hsl(var(--primary)); background: linear-gradient(180deg, white 0%, hsl(var(--muted) / 0.3) 100%); overflow: hidden;">
            <div class="card-header" style="background: hsl(var(--primary)); color: ${getContrastColor(organismData.couleurPrincipale)}; padding: 1.25rem; border-radius: 0;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <svg style="width: 1.5rem; height: 1.5rem; color: ${getContrastColor(organismData.couleurPrincipale)};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 style="margin: 0; color: ${getContrastColor(organismData.couleurPrincipale)}; font-size: 1.25rem; font-weight: 700;">Informations</h3>
              </div>
            </div>
            <div class="card-content space-y-4" style="padding: 1.5rem;">
              <!-- Grille Référence + Durée -->
              <div class="product-info-grid" style="display: grid; grid-template-columns: ${formation.code_produit ? '1fr 1fr 1fr' : '1fr 1fr'}; gap: 0.75rem;">
                <!-- Référence PRO (toujours affichée) -->
                <div style="background: hsl(var(--primary) / 0.05); padding: 1rem; border-radius: 0.5rem; display: flex; flex-direction: column; justify-content: center; min-height: 100px;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; height: 24px;">
                    <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    <p class="text-sm font-semibold" style="color: hsl(var(--primary)); margin: 0; white-space: nowrap;">RÉFÉRENCE</p>
                  </div>
                  <p class="font-bold" style="font-size: 0.95rem; margin: 0; text-align: center; word-break: break-all;">${formation.reference}</p>
                </div>
                
                <!-- Code produit (seulement si présent) -->
                ${formation.code_produit ? `
                <div style="background: hsl(var(--primary) / 0.05); padding: 1rem; border-radius: 0.5rem; display: flex; flex-direction: column; justify-content: center; min-height: 100px;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; height: 24px;">
                    <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                    </svg>
                    <p class="text-sm font-semibold" style="color: hsl(var(--primary)); margin: 0; white-space: nowrap;">CODE</p>
                  </div>
                  <p class="font-bold" style="font-size: 1.125rem; margin: 0; text-align: center;">${formation.code_produit}</p>
                </div>
                ` : ''}
                
                <!-- Durée -->
                <div style="background: hsl(var(--primary) / 0.05); padding: 1rem; border-radius: 0.5rem; display: flex; flex-direction: column; justify-content: center; min-height: 100px;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; height: 24px;">
                    <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-sm font-semibold" style="color: hsl(var(--primary)); margin: 0; white-space: nowrap;">DURÉE</p>
                  </div>
                  <p class="font-bold" style="font-size: 1.125rem; margin: 0; text-align: center;">${formatDuree(formation.duree_heures, formation.duree_jours)}</p>
                </div>
              </div>
              
              <!-- Bloc Prix -->
              <div style="background: hsl(var(--primary) / 0.05); padding: 1.25rem; border-radius: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                  <svg style="width: 1.125rem; height: 1.125rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p class="text-sm font-semibold" style="color: hsl(var(--primary)); margin: 0;">PRIX</p>
                </div>
                ${getPrixHTML(formation.prix)}
              </div>
              
              <!-- Bouton Devis -->
              <button class="btn btn-default w-full" style="padding: 1rem; font-weight: 600;" onclick="openDevisModal('${formation.titre.replace(/'/g, "\\'")}', '${formation.reference}')">
                <svg style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem; display: inline;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Demander un devis
              </button>
            </div>
          </div>
          
          ${createProchainessessionsCard(formation)}
        </div>
        </div>
      </div>
    </div>
  `;

  // Scroll vers le haut
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Créer la carte Objectifs
function createObjectifsCard(formation) {
  if (!formation.objectifs || formation.objectifs.length === 0) {
    return `
      <div class="card fade-in">
        <div class="card-header">
          <h3 class="card-title">Objectifs</h3>
        </div>
        <div class="card-content">
          <p class="text-muted-foreground">Objectifs non spécifiés</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">Objectifs</h3>
        </div>
      </div>
      <div class="card-content" style="padding: 1.5rem;">
        <ul class="space-y-3" style="list-style: none; padding: 0;">
          ${formation.objectifs.map(obj => `
            <li style="display: flex; gap: 0.75rem; align-items: start;">
              <span style="color: hsl(var(--primary)); font-weight: 700; font-size: 1.25rem; line-height: 1.5;">•</span>
              <span style="flex: 1;">${obj}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Créer la carte Public
function createPublicCard(formation) {
  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">À qui s'adresse la formation ?</h3>
        </div>
      </div>
      <div class="card-content space-y-4" style="padding: 1.5rem;">
        <div>
          <div style="display: inline-block; background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem;">
            PUBLIC CONCERNÉ
          </div>
          <p>${formation.publicConcerne}</p>
        </div>
        <div class="separator separator-horizontal"></div>
        <div>
          <div style="display: inline-block; background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem;">
            PRÉREQUIS
          </div>
          <ul class="space-y-2" style="list-style: none; padding: 0;">
            ${formation.prerequis.map(pre => `
              <li style="display: flex; gap: 0.5rem; align-items: start;">
                <span style="color: hsl(var(--primary)); font-weight: 700;">✓</span>
                <span>${pre}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

// Créer la carte Modalités
function createModalitesCard(formation) {
  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">Modalités</h3>
        </div>
      </div>
      <div class="card-content space-y-4" style="padding: 1.5rem;">
        <div>
          <div style="display: inline-block; background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem;">
            DÉROULEMENT
          </div>
          <p>${formation.modalites.deroulement}</p>
        </div>
        <div class="separator separator-horizontal"></div>
        <div>
          <div style="display: inline-block; background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem;">
            MÉTHODES ET MOYENS
          </div>
          <p class="whitespace-pre-line">${formation.modalites.methodes_et_moyens}</p>
        </div>
      </div>
    </div>
  `;
}

// Créer la carte Accessibilité
function createAccessibiliteCard(formation) {
  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">Accessibilité</h3>
        </div>
      </div>
      <div class="card-content" style="padding: 1.5rem;">
        <p>${formation.accessibiliteHandicap}</p>
      </div>
    </div>
  `;
}

// Créer la carte Compétences développées
function createCompetencesCard(formation) {
  // Vérifier si les compétences existent et ne sont pas vides
  if (!formation.competence_apprenant || formation.competence_apprenant.trim() === '') {
    return ''; // Ne pas afficher la carte si pas de compétences
  }

  // Séparer les compétences par le séparateur "|"
  const competences = formation.competence_apprenant.split('|').filter(c => c.trim() !== '');

  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">Compétences développées</h3>
        </div>
      </div>
      <div class="card-content" style="padding: 1.5rem;">
        <ul class="list-disc list-inside space-y-2">
          ${competences.map(comp => `<li>${comp.trim()}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Créer la carte Programme
function createProgrammeCard(formation) {
  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">Programme</h3>
        </div>
      </div>
      <div class="card-content programme-content" style="padding: 1.5rem;">
        ${formation.programme}
      </div>
    </div>
  `;
}

// Créer la carte Évaluation
function createEvaluationCard(formation) {
  if (!formation.evaluation || formation.evaluation.length === 0) {
    return `
      <div class="card fade-in">
        <div class="card-header">
          <h3 class="card-title">Contrôle des connaissances</h3>
        </div>
        <div class="card-content">
          <p class="text-muted-foreground">Information non disponible</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">Contrôle des connaissances</h3>
        </div>
      </div>
      <div class="card-content" style="padding: 1.5rem;">
        <ul class="space-y-2" style="list-style: none; padding: 0;">
          ${formation.evaluation.map(item => `
            <li style="display: flex; gap: 0.5rem; align-items: start;">
              <span style="color: hsl(var(--primary)); font-weight: 700;">✓</span>
              <span>${item}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Créer la carte Maintien des connaissances
function createMaintienConnaissancesCard(formation) {
  // Vérifier si le maintien des connaissances existe
  if (!formation.maint_connaissance || formation.maint_connaissance.trim() === '') {
    return ''; // Ne pas afficher la carte si pas de maintien
  }

  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">Maintien des connaissances</h3>
        </div>
      </div>
      <div class="card-content" style="padding: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 1rem; background: hsl(var(--primary) / 0.05); padding: 1rem; border-radius: 0.5rem;">
          <svg style="width: 2rem; height: 2rem; color: hsl(var(--primary)); flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <div>
            <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin: 0 0 0.25rem 0;">Recyclage recommandé tous les</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: hsl(var(--primary)); margin: 0;">${formation.maint_connaissance}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Créer la carte Avis et Résultats (fusionnée)
function createAvisEtResultatsCard(formation) {
  // Fonction helper pour vérifier si une valeur existe et est > 0
  const hasValue = (value) => value !== null && value !== undefined && value !== '' &&
    value !== 'null' && value !== 'NULL' && value !== 0 && value !== '0' &&
    parseFloat(value) > 0;

  // Vérifier si au moins un avis ou résultat a une valeur significative
  const hasAvis = hasValue(formation.avis.intervenant) || hasValue(formation.avis.pedagogie) ||
    hasValue(formation.avis.contenu) || hasValue(formation.avis.objectifs);
  const hasResultats = hasValue(formation.resultats.participation) || hasValue(formation.resultats.reussite);

  // Si aucune donnée, ne pas afficher la carte
  if (!hasAvis && !hasResultats) {
    return '';
  }

  // Fonction helper pour afficher la valeur ou "n/a"
  const formatValue = (value) => hasValue(value) ? `${parseFloat(value)}%` : 'n/a';

  return `
    <div class="card fade-in" style="background: white; border: 2px solid hsl(var(--border)); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);">
      <div class="card-content" style="padding: 2.5rem;">
        ${hasAvis ? `
          <!-- Avis sur la formation -->
          <div ${hasResultats ? 'style="margin-bottom: 3rem;"' : ''}>
            <h3 style="font-size: 2rem; font-weight: 700; margin-bottom: 2rem; color: hsl(var(--foreground));">Les avis sur la formation</h3>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 2rem;">
              <div style="text-align: center;">
                <p style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 0.5rem;">Intervenant</p>
                <p style="font-size: 3.5rem; font-weight: 700; color: ${hasValue(formation.avis.intervenant) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}; line-height: 1;">${formatValue(formation.avis.intervenant)}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 0.5rem;">Pédagogie</p>
                <p style="font-size: 3.5rem; font-weight: 700; color: ${hasValue(formation.avis.pedagogie) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}; line-height: 1;">${formatValue(formation.avis.pedagogie)}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 0.5rem;">Contenu</p>
                <p style="font-size: 3.5rem; font-weight: 700; color: ${hasValue(formation.avis.contenu) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}; line-height: 1;">${formatValue(formation.avis.contenu)}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 0.5rem;">Objectifs</p>
                <p style="font-size: 3.5rem; font-weight: 700; color: ${hasValue(formation.avis.objectifs) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}; line-height: 1;">${formatValue(formation.avis.objectifs)}</p>
              </div>
            </div>
            
            <!-- Phrase d'information sur les indicateurs de qualité -->
            <p style="font-size: 1rem; color: hsl(var(--muted-foreground)); line-height: 1.6;">
              Pour en savoir plus sur la façon dont nos prestations sont évaluées consultez la page consacrée à <a href="#" onclick="showIndicateursQualite(event, '${formation.reference}')" style="color: hsl(var(--primary)); font-weight: 600; text-decoration: none; cursor: pointer;">nos indicateurs de qualité</a>.
            </p>
          </div>
        ` : ''}
        
        ${hasResultats ? `
          <!-- Résultats obtenus -->
          <div>
            <h3 style="font-size: 2rem; font-weight: 700; margin-bottom: 2rem; color: hsl(var(--foreground));">Les résultats obtenus</h3>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
              <div style="background: white; border: 2px solid hsl(var(--primary)); border-radius: 0.75rem; padding: 2rem; text-align: center;">
                <p style="font-size: 1rem; font-weight: 600; color: hsl(var(--primary)); margin-bottom: 0.75rem;">Taux de<br>participation</p>
                <p style="font-size: 4rem; font-weight: 700; color: ${hasValue(formation.resultats.participation) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}; line-height: 1;">${formatValue(formation.resultats.participation)}</p>
              </div>
              <div style="background: hsl(var(--primary)); border-radius: 0.75rem; padding: 2rem; text-align: center;">
                <p style="font-size: 1rem; font-weight: 600; color: white; margin-bottom: 0.75rem;">Taux de réussite</p>
                <p style="font-size: 4rem; font-weight: 700; color: ${hasValue(formation.resultats.reussite) ? 'white' : 'rgba(255, 255, 255, 0.5)'}; line-height: 1;">${formatValue(formation.resultats.reussite)}</p>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Créer la carte Certification
function createCertificationCard(formation) {
  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary));">
      <div class="card-header" style="background: hsl(var(--primary) / 0.05); border-bottom: 1px solid hsl(var(--primary) / 0.2); padding: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="background: hsl(var(--primary)); color: white; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
            </svg>
          </div>
          <h3 class="card-title" style="margin: 0;">Formation certifiante</h3>
        </div>
      </div>
      <div class="card-content" style="padding: 1.5rem;">
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: ${formation.certification.estCertifiante ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))'}; color: ${formation.certification.estCertifiante ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; width: fit-content;">
            ${formation.certification.estCertifiante ? `
              <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ` : ''}
            ${formation.certification.estCertifiante ? 'Oui' : 'Non'}
          </div>
          ${formation.certification.estCertifiante && formation.certification.url ? `
            <a href="${formation.certification.url}" target="_blank" rel="noopener noreferrer" class="btn btn-default inline-flex" style="width: fit-content;">
              Voir la fiche France Compétences
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Retour au catalogue
function backToCatalogue() {
  renderCatalogue(formationsData);
}

// Gérer la recherche
function handleSearch(value) {
  searchQuery = value;
  renderCatalogue(formationsData);

  // Restaurer le focus sur le champ de recherche
  setTimeout(() => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
      // Placer le curseur à la fin du texte
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }, 0);
}

// Gérer la recherche depuis le Hero (page d'accueil spécifique)
function handleHeroSearchSubmit(value) {
  // Enregistrer la recherche
  searchQuery = value;
  
  // Naviguer vers le catalogue
  goToCatalogue();
  
  // Après le chargement du catalogue, mettre à jour le champ de recherche visuel
  setTimeout(() => {
    const mainSearchInput = document.getElementById('search-input');
    if (mainSearchInput) {
      mainSearchInput.value = searchQuery;
    }
    // Lancer le filtrage visuel du catalogue (déjà fait par goToCatalogue qui appelle renderCatalogue, 
    // mais on force le focus comme une recherche normale)
    handleSearch(searchQuery);
  }, 100);
}

// Effacer la recherche
function clearSearch() {
  searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
  }
  renderCatalogue(formationsData);
}

// Créer la carte des prochaines sessions
function createProchainessessionsCard(formation) {
  // Filtrer les sessions pour ce produit
  // Utiliser code_produit s'il existe, sinon utiliser reference (pour compatibilité)
  const sessionsForProduct = sessionsData.filter(session =>
    session.code_produit === (formation.code_produit || formation.reference)
  );

  // Filtrer les sessions futures et les trier par date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureSessions = sessionsForProduct
    .filter(session => {
      const sessionDate = new Date(session.date_debut);
      return sessionDate >= today;
    })
    .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
    .slice(0, 3); // Prendre les 3 prochaines

  // Si aucune session future, ne pas afficher le bloc
  if (futureSessions.length === 0) {
    return '';
  }

  // Générer le HTML des sessions
  const sessionsHTML = futureSessions.map(session => {
    const dateDebut = new Date(session.date_debut);
    const dateFormatted = dateDebut.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Capitaliser la première lettre du jour
    const dateCapitalized = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

    const lieu = session.ville ? `${session.ville}${session.code_postal ? ' (' + session.code_postal + ')' : ''}` : 'À déterminer';
    const modalite = session.modalite || 'Non spécifiée';

    return `
      <div onclick="showSessionDetail('${session.reference}')" style="padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.1)'; this.style.borderColor='hsl(var(--primary))'" onmouseout="this.style.boxShadow='none'; this.style.borderColor='hsl(var(--border))'">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">${dateCapitalized}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <svg style="width: 0.875rem; height: 0.875rem; color: hsl(var(--muted-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0;">${lieu}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <svg style="width: 0.875rem; height: 0.875rem; color: hsl(var(--muted-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0;">${modalite}</p>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="card" style="border-left: 4px solid hsl(var(--primary)); background: linear-gradient(180deg, white 0%, hsl(var(--muted) / 0.3) 100%); overflow: hidden; margin-top: 1.5rem;">
      <div class="card-header" style="background: hsl(var(--primary)); color: ${getContrastColor(organismData.couleurPrincipale)}; padding: 1.25rem; border-radius: 0;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <svg style="width: 1.5rem; height: 1.5rem; color: ${getContrastColor(organismData.couleurPrincipale)};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <h3 style="margin: 0; color: ${getContrastColor(organismData.couleurPrincipale)}; font-size: 1.25rem; font-weight: 700;">Prochaines Sessions</h3>
        </div>
      </div>
      <div class="card-content" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
        ${sessionsHTML}
        
        <!-- Bouton Voir toutes les sessions -->
        <button onclick="goToCalendarWithFilter('${formation.titre.replace(/'/g, "\\'")}')" class="btn btn-outline w-full" style="margin-top: 0.5rem; font-weight: 600;">
          Voir toutes les sessions
          <svg style="width: 1rem; height: 1rem; margin-left: 0.5rem; display: inline;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Effacer la recherche de sessions
function clearSessionSearch() {
  sessionSearchQuery = '';
  renderCalendrierView();
}

// Aller au calendrier avec un filtre sur un produit
function goToCalendarWithFilter(productTitle) {
  // Aller au calendrier
  goToCalendar();

  // Appliquer le filtre de recherche sur le titre du produit
  sessionSearchQuery = productTitle;

  // Attendre que la vue soit rendue
  setTimeout(() => {
    const searchInput = document.getElementById('session-search-input');
    if (searchInput) {
      searchInput.value = productTitle;
    }
    renderSessionsList();
  }, 100);
}

// Fonctions de navigation


function filterByHierarchy(type, value) {
  currentHierarchyFilter = { type, value };
  currentFilter = 'all';

  // Masquer les autres vues (calendrier, indicateurs, produit, session-detail)
  document.getElementById('calendrier-view').classList.add('hidden');
  document.getElementById('produit-view').classList.add('hidden');
  document.getElementById('session-detail-view').classList.add('hidden');

  const indicateursView = document.getElementById('indicateurs-view');
  if (indicateursView) {
    indicateursView.classList.add('hidden');
  }

  // Afficher la vue catalogue
  document.getElementById('catalogue-view').classList.remove('hidden');

  renderCatalogue(formationsData);
}

function goToCalendar() {
  toggleCustomView('calendrier-view', false);
  history.pushState({ viewId: 'calendrier-view' }, '', '/calendrier');
  renderCalendrierView();
}

// Variables pour la recherche et les filtres de sessions
let sessionSearchQuery = '';
let sessionFilters = {
  lieu: '',
  statut: '',
  dateDebut: '',
  placesMin: ''
};
let showSessionFilters = false;

// Rendre la vue Calendrier
function renderCalendrierView() {
  const calendrierView = document.getElementById('calendrier-view');

  calendrierView.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <!-- En-tête avec recherche -->
      <div style="margin-bottom: 2rem;">
        <h1 style="font-size: 2.5rem; font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 1rem;">
          Calendrier des Sessions
        </h1>
        <p style="color: hsl(var(--muted-foreground)); font-size: 1.125rem; margin-bottom: 2rem;">
          Découvrez nos prochaines sessions de formation disponibles
        </p>
        
        <!-- Barre de recherche et bouton filtres -->
        <div class="calendar-search-bar" style="display: flex; gap: 1rem; align-items: start; margin-bottom: 1.5rem;">
          <div style="position: relative; flex: 1; max-width: 600px;">
            <input 
              type="text" 
              id="session-search-input"
              placeholder="Rechercher une session (nom, ville, modalité...)"
              value="${sessionSearchQuery}"
              style="width: 100%; padding: 0.875rem 3rem 0.875rem 3rem; border: 2px solid hsl(var(--border)); border-radius: 0.5rem; font-size: 1rem; transition: all 0.2s;"
              onfocus="this.style.borderColor='hsl(var(--primary))'; this.style.outline='none';"
              onblur="this.style.borderColor='hsl(var(--border))';"
            />
            <svg style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 1.25rem; height: 1.25rem; color: hsl(var(--muted-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <div id="clear-search-button-container"></div>
          </div>
          
          <!-- Bouton Filtres avancés -->
          <button id="session-filters-button" onclick="toggleSessionFilters()" class="btn ${showSessionFilters ? 'btn-default' : 'btn-outline'}" style="white-space: nowrap; display: flex; align-items: center; gap: 0.5rem;">
            <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            Filtres avancés
            <span id="session-filters-badge"></span>
          </button>
        </div>
        
        <!-- Panneau de filtres (masqué par défaut) -->
        ${showSessionFilters ? `
        <div style="background: hsl(var(--muted) / 0.3); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem; border: 1px solid hsl(var(--border));">
          <div class="session-filters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
            <!-- Filtre Lieu -->
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: hsl(var(--muted-foreground));">Lieu</label>
              <select id="filter-lieu" onchange="updateSessionFilter('lieu', this.value)" style="width: 100%; padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem;">
                <option value="">Tous les lieux</option>
                ${getUniqueLieux().map(lieu => `<option value="${lieu}" ${sessionFilters.lieu === lieu ? 'selected' : ''}>${lieu}</option>`).join('')}
              </select>
            </div>
            
            <!-- Filtre Statut -->
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: hsl(var(--muted-foreground));">Statut</label>
              <select id="filter-statut" onchange="updateSessionFilter('statut', this.value)" style="width: 100%; padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem;">
                <option value="">Tous les statuts</option>
                <option value="CONFIRMÉ" ${sessionFilters.statut === 'CONFIRMÉ' ? 'selected' : ''}>Confirmé</option>
                <option value="PRÉVISIONNEL" ${sessionFilters.statut === 'PRÉVISIONNEL' ? 'selected' : ''}>Prévisionnel</option>
              </select>
            </div>
            
            <!-- Filtre Date de début -->
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: hsl(var(--muted-foreground));">Date de début (à partir de)</label>
              <input 
                type="text" 
                id="filter-date" 
                value="${sessionFilters.dateDebut}" 
                placeholder="Sélectionner une date"
                readonly
                style="width: 100%; padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem; color: hsl(var(--foreground)); cursor: pointer; transition: all 0.2s;"
              />
            </div>
            
            <!-- Filtre Places disponibles minimum -->
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: hsl(var(--muted-foreground));">Places disponibles (min.)</label>
              <select id="filter-places" onchange="updateSessionFilter('placesMin', this.value)" style="width: 100%; padding: 0.5rem; border: 1px solid hsl(var(--border)); border-radius: 0.375rem; background: white; font-size: 0.875rem;">
                <option value="">Toutes</option>
                <option value="1" ${sessionFilters.placesMin === '1' ? 'selected' : ''}>1+</option>
                <option value="5" ${sessionFilters.placesMin === '5' ? 'selected' : ''}>5+</option>
                <option value="10" ${sessionFilters.placesMin === '10' ? 'selected' : ''}>10+</option>
                <option value="15" ${sessionFilters.placesMin === '15' ? 'selected' : ''}>15+</option>
              </select>
            </div>
          </div>
          
          <!-- Conteneur pour le bouton réinitialiser -->
          <div id="reset-filters-container"></div>
        </div>
        ` : ''}
      </div>
      
      <!-- Liste des sessions -->
      <div id="sessions-container"></div>
    </div>
  `;

  // Ajouter l'événement de recherche
  const searchInput = document.getElementById('session-search-input');
  searchInput.addEventListener('input', (e) => {
    sessionSearchQuery = e.target.value;
    updateClearSearchButton();
    renderSessionsList();
  });

  // Initialiser Flatpickr pour le date picker si les filtres sont affichés
  if (showSessionFilters) {
    const dateInput = document.getElementById('filter-date');
    if (dateInput) {
      const fp = flatpickr(dateInput, {
        locale: 'fr',
        dateFormat: 'Y-m-d',
        minDate: 'today',
        altInput: true,
        altFormat: 'j F Y',
        disableMobile: true,
        monthSelectorType: 'static',
        onChange: function (selectedDates, dateStr) {
          updateSessionFilter('dateDebut', dateStr);
        },
        onReady: function (selectedDates, dateStr, instance) {
          // Forcer les styles sur l'input alternatif
          if (instance.altInput) {
            instance.altInput.style.width = '100%';
            instance.altInput.style.padding = '0.5rem';
            instance.altInput.style.border = '1px solid hsl(var(--border))';
            instance.altInput.style.borderRadius = '0.375rem';
            instance.altInput.style.background = 'white';
            instance.altInput.style.fontSize = '0.875rem';
            instance.altInput.style.color = 'hsl(var(--foreground))';
            instance.altInput.style.cursor = 'pointer';
            instance.altInput.style.transition = 'all 0.2s';
            instance.altInput.style.boxSizing = 'border-box';
          }
        },
        onOpen: function (selectedDates, dateStr, instance) {
          // Ajouter une bordure rouge à l'input au focus
          if (instance.altInput) {
            instance.altInput.style.borderColor = 'hsl(var(--primary))';
          }
        },
        onClose: function (selectedDates, dateStr, instance) {
          // Remettre la bordure normale
          if (instance.altInput) {
            instance.altInput.style.borderColor = 'hsl(var(--border))';
          }
        }
      });
    }

    // Mettre à jour le bouton de réinitialisation
    updateResetFiltersButton();
  }

  // Mettre à jour le badge du bouton "Filtres avancés"
  updateSessionFiltersBadge();

  // Mettre à jour le bouton de suppression de recherche
  updateClearSearchButton();

  // Rendre la liste des sessions
  renderSessionsList();
}

// Mettre à jour le bouton de suppression de recherche
function updateClearSearchButton() {
  const container = document.getElementById('clear-search-button-container');
  if (!container) return;

  if (sessionSearchQuery && sessionSearchQuery.trim() !== '') {
    container.innerHTML = `
      <button 
        id="clear-session-search"
        onclick="clearSessionSearch()"
        style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 0.25rem; display: flex; align-items: center; justify-content: center; color: hsl(var(--muted-foreground)); transition: color 0.2s;"
        onmouseover="this.style.color='hsl(var(--primary))'"
        onmouseout="this.style.color='hsl(var(--muted-foreground))'"
      >
        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
  } else {
    container.innerHTML = '';
  }
}

// Mettre à jour le badge du bouton "Filtres avancés"
function updateSessionFiltersBadge() {
  const badge = document.getElementById('session-filters-badge');
  const button = document.getElementById('session-filters-button');
  if (!badge || !button) return;

  const count = getActiveSessionFiltersCount();
  const isOpen = showSessionFilters;

  if (count > 0) {
    badge.innerHTML = count;
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.minWidth = '1.5rem';
    badge.style.height = '1.5rem';
    badge.style.padding = '0 0.375rem';
    badge.style.background = isOpen ? 'white' : 'hsl(var(--primary))';
    badge.style.color = isOpen ? 'hsl(var(--primary))' : 'white';
    badge.style.borderRadius = '9999px';
    badge.style.fontSize = '0.75rem';
    badge.style.fontWeight = '600';
    badge.style.marginLeft = '0.25rem';
  } else {
    badge.innerHTML = '';
    badge.style.display = 'none';
  }
}

// Mettre à jour le bouton de réinitialisation des filtres
function updateResetFiltersButton() {
  const container = document.getElementById('reset-filters-container');
  if (!container) return;

  if (getActiveSessionFiltersCount() > 0) {
    container.innerHTML = `
      <div style="text-align: right; margin-top: 1rem;">
        <button onclick="resetSessionFilters()" class="btn btn-outline" style="font-size: 0.875rem;">
          <svg style="width: 1rem; height: 1rem; display: inline; margin-right: 0.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Réinitialiser les filtres
        </button>
      </div>
    `;
  } else {
    container.innerHTML = '';
  }
}

// Obtenir les lieux uniques
function getUniqueLieux() {
  const lieux = [...new Set(sessionsData.map(s => s.ville).filter(v => v && v.trim() !== ''))];
  return lieux.sort();
}

// Compter les filtres actifs
function getActiveSessionFiltersCount() {
  let count = 0;
  if (sessionFilters.lieu) count++;
  if (sessionFilters.statut) count++;
  if (sessionFilters.dateDebut) count++;
  if (sessionFilters.placesMin) count++;
  return count;
}

// Basculer l'affichage des filtres
function toggleSessionFilters() {
  showSessionFilters = !showSessionFilters;
  renderCalendrierView();
}

// Mettre à jour un filtre de session
function updateSessionFilter(filterName, value) {
  sessionFilters[filterName] = value;
  updateSessionFiltersBadge();
  updateResetFiltersButton();
  renderSessionsList();
}

// Réinitialiser les filtres de sessions
function resetSessionFilters() {
  sessionFilters = {
    lieu: '',
    statut: '',
    dateDebut: '',
    placesMin: ''
  };
  renderCalendrierView();
}

// Rendre la liste des sessions filtrées
function renderSessionsList() {
  const container = document.getElementById('sessions-container');

  // Filtrer les sessions selon la recherche et les filtres
  const filteredSessions = sessionsData.filter(session => {
    // Filtre de recherche
    if (sessionSearchQuery) {
      const query = sessionSearchQuery.toLowerCase();
      const matchesSearch = (
        session.libelle_produit.toLowerCase().includes(query) ||
        session.ville.toLowerCase().includes(query) ||
        session.modalite.toLowerCase().includes(query) ||
        session.code_postal.toLowerCase().includes(query) ||
        session.intervenant.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Filtre par lieu
    if (sessionFilters.lieu && session.ville !== sessionFilters.lieu) {
      return false;
    }

    // Filtre par statut
    if (sessionFilters.statut && session.statut !== sessionFilters.statut) {
      return false;
    }

    // Filtre par date de début (à partir de)
    if (sessionFilters.dateDebut) {
      const sessionDate = new Date(session.date_debut).toISOString().split('T')[0];
      if (sessionDate < sessionFilters.dateDebut) {
        return false;
      }
    }

    // Filtre par places disponibles minimum
    if (sessionFilters.placesMin) {
      const minPlaces = parseInt(sessionFilters.placesMin);
      if (!session.publication_places || session.places_disponibles < minPlaces) {
        return false;
      }
    }

    return true;
  });

  // Afficher les sessions ou un message si aucune
  if (filteredSessions.length === 0) {
    const hasActiveFilters = getActiveSessionFiltersCount() > 0;
    const hasSearch = sessionSearchQuery !== '';

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem; background: hsl(var(--muted) / 0.3); border-radius: 0.75rem; border: 2px dashed hsl(var(--border));">
        <svg style="width: 4rem; height: 4rem; margin: 0 auto 1.5rem; color: hsl(var(--muted-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <h3 style="font-size: 1.5rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 0.5rem;">
          Aucune session trouvée
        </h3>
        <p style="color: hsl(var(--muted-foreground)); margin-bottom: 1.5rem;">
          ${hasSearch ? `Aucune session ne correspond à votre recherche "${sessionSearchQuery}".` : 'Aucune session disponible pour le moment.'}
        </p>
        ${(hasSearch || hasActiveFilters) ? `
          <button onclick="sessionSearchQuery = ''; resetSessionFilters();" class="btn btn-default">
            ${hasActiveFilters ? 'Réinitialiser les filtres' : 'Voir toutes les sessions'}
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  // Afficher le nombre de résultats
  const resultCount = `
    <div style="margin-bottom: 1.5rem; color: hsl(var(--muted-foreground)); font-size: 0.95rem;">
      <strong style="color: hsl(var(--foreground));">${filteredSessions.length}</strong> session${filteredSessions.length > 1 ? 's' : ''} disponible${filteredSessions.length > 1 ? 's' : ''}
      ${sessionSearchQuery ? ` pour "<strong style="color: hsl(var(--primary));">${sessionSearchQuery}</strong>"` : ''}
    </div>
  `;

  // Générer les cartes de sessions
  const sessionsHTML = filteredSessions.map(session => createSessionCard(session)).join('');

  container.innerHTML = resultCount + `<div style="display: flex; flex-direction: column; gap: 1.5rem;">${sessionsHTML}</div>`;
}

// Créer une carte de session (format allongé)
function createSessionCard(session) {
  // Récupérer la formation associée pour les tarifs
  const formation = formationsData.find(f => f.code_produit === session.code_produit);

  // Formater la date de début avec majuscule au jour
  const date = new Date(session.date_debut);
  let dateFormatted = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  // Capitaliser la première lettre
  dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  // Formater la date de fin
  let dateFin = '';
  if (session.date_fin) {
    const datefinObj = new Date(session.date_fin);
    // Ne pas afficher la date de fin si elle est identique à la date de début
    if (session.date_fin !== session.date_debut) {
      dateFin = datefinObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      dateFin = dateFin.charAt(0).toUpperCase() + dateFin.slice(1);
    }
  }

  // Badge de statut - CONFIRMÉ avec fond couleur principale, PRÉVISIONNEL avec bordure et texte couleur principale
  const isConfirme = session.statut === 'CONFIRMÉ';
  const statutStyle = isConfirme
    ? 'background: hsl(var(--primary)); color: white; border: none;'
    : 'background: transparent; color: hsl(var(--primary)); border: 2px solid hsl(var(--primary));';

  // Lieu
  const lieu = (session.ville && session.ville.trim() !== '') ? `${session.ville}${session.code_postal ? ` (${session.code_postal})` : ''}` : 'À déterminer';

  return `
    <div class="card fade-in" style="border-left: 4px solid hsl(var(--primary)); transition: all 0.3s ease; cursor: pointer;" onmouseover="this.style.boxShadow='0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'" onmouseout="this.style.boxShadow=''" onclick="showSessionDetail('${session.reference}')">
      <div class="card-content" style="padding: 1.5rem;">
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 2rem; align-items: start;">
          <!-- Informations principales -->
          <div>
            <!-- Titre et badge statut -->
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
              <h3 style="font-size: 1.5rem; font-weight: 700; color: hsl(var(--foreground)); margin: 0;">
                ${session.libelle_produit}
              </h3>
              <span style="display: inline-block; padding: 0.25rem 0.75rem; ${statutStyle} border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">
                ${session.statut}
              </span>
            </div>
            
            <!-- Référence -->
            <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem; margin-bottom: 1rem;">
              Réf: ${session.reference}
            </p>
            
            <!-- Détails en grille -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <!-- Dates -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--primary)); flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <div>
                  <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0; text-transform: uppercase; font-weight: 600;">Date${dateFin ? 's' : ''}</p>
                  <p style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0; line-height: 1.4;">
                    ${dateFormatted}${dateFin ? `<br/><span style="font-size: 0.75rem; color: hsl(var(--muted-foreground));">au</span> ${dateFin}` : ''}
                  </p>
                </div>
              </div>
              
              <!-- Lieu -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--primary)); flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div>
                  <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0; text-transform: uppercase; font-weight: 600;">Lieu</p>
                  <p style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">${lieu}</p>
                </div>
              </div>
              
              <!-- Modalité -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--primary)); flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <div>
                  <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0; text-transform: uppercase; font-weight: 600;">Modalité</p>
                  <p style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">${session.modalite}</p>
                </div>
              </div>
              
              <!-- Durée -->
              ${session.duree_heures || session.duree_jours ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--primary)); flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0; text-transform: uppercase; font-weight: 600;">Durée</p>
                  <p style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">${session.duree_heures}${session.duree_jours ? ` (${session.duree_jours} jour${parseInt(session.duree_jours) > 1 ? 's' : ''})` : ''}</p>
                </div>
              </div>
              ` : ''}
              
              <!-- Tarifs -->
              ${formation && formation.prix && formation.prix.apprenant ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--primary)); flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0; text-transform: uppercase; font-weight: 600;">Tarifs</p>
                  <p style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">
                    ${formation.prix.apprenant} € / apprenant
                  </p>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Places disponibles (si publication activée) -->
          ${session.publication_places ? `
          <div style="text-align: center; padding: 1.5rem; background: hsl(var(--primary) / 0.05); border-radius: 0.5rem; min-width: 150px;">
            <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0 0 0.5rem 0; text-transform: uppercase; font-weight: 600;">Places disponibles</p>
            <p style="font-size: 2.5rem; font-weight: 700; color: hsl(var(--primary)); margin: 0; line-height: 1;">${session.places_disponibles}</p>
            <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0.25rem 0 0 0;">sur ${session.effectif_max}</p>
          </div>
          ` : ''}
        </div>
        
        <!-- Boutons d'action -->
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid hsl(var(--border)); display: flex; gap: 0.75rem;">
          <button 
            class="btn btn-default" 
            style="flex: 2; padding: 0.875rem; font-weight: 600; height: 48px; display: flex; align-items: center; justify-content: center;"
            onclick="event.stopPropagation(); openPreinscriptionModal('${session.libelle_produit.replace(/'/g, "\\'")}', '${dateFormatted}', '${lieu.replace(/'/g, "\\'")}', '${session.reference}', getProductReferenceFromCode('${session.code_produit}'))"
          >
            <svg style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
            Se préinscrire
          </button>
          <button 
            class="btn" 
            style="flex: 1; padding: 0.875rem; font-weight: 600; height: 48px; display: flex; align-items: center; justify-content: center; background: white; color: hsl(var(--primary)); border: 2px solid hsl(var(--primary)); transition: all 0.2s ease; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);"
            onmouseover="this.style.boxShadow='0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'; this.style.transform='translateY(-2px)';"
            onmouseout="this.style.boxShadow='0 1px 2px 0 rgb(0 0 0 / 0.05)'; this.style.transform='translateY(0)';"
            onclick="showSessionDetail('${session.reference}')"
          >
            <svg style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            Détails
          </button>
        </div>
      </div>
    </div>
  `;
}

// Afficher le détail d'une session
function showSessionDetail(sessionReference) {
  // Trouver la session
  const session = sessionsData.find(s => s.reference === sessionReference);
  if (!session) {
    console.error('Session non trouvée:', sessionReference);
    return;
  }

  // Trouver la formation correspondante
  // session.code_produit contient le code produit (ex: "SST-I")
  // formation.reference contient aussi le code produit (ex: "SST-I")
  let formation = formationsData.find(f => f.reference === session.code_produit);

  // Si pas trouvé par reference, essayer par le nom exact
  if (!formation && session.libelle_produit) {
    formation = formationsData.find(f => f.titre.toLowerCase() === session.libelle_produit.toLowerCase());
    if (formation) {
      console.log('✅ Formation trouvée par nom:', formation.titre);
    }
  }

  if (!formation) {
    console.error(`❌ Formation non trouvée pour:`, {
      code_produit: session.code_produit,
      libelle_produit: session.libelle_produit,
      formations_disponibles: formationsData.map(f => ({ reference: f.reference, titre: f.titre }))
    });
  }

  // Masquer les autres vues et afficher session-detail-view
  toggleCustomView('session-detail-view', false);

  // Rendre le détail de la session
  renderSessionDetail(session, formation);
}

// Rendre le détail d'une session
function renderSessionDetail(session, formation) {
  const sessionDetailView = document.getElementById('session-detail-view');

  // Formater la date avec majuscule au jour
  const date = new Date(session.date_debut);
  let dateFormatted = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  // Capitaliser la première lettre
  dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  // Badge de statut - CONFIRMÉ avec fond couleur principale, PRÉVISIONNEL avec bordure et texte couleur principale
  const isConfirme = session.statut === 'CONFIRMÉ';
  const statutStyle = isConfirme
    ? 'background: hsl(var(--primary)); color: white; border: none;'
    : 'background: transparent; color: hsl(var(--primary)); border: 2px solid hsl(var(--primary));';

  // Lieu avec adresse complète
  let lieu = 'À déterminer';
  let lieuDetermine = false;
  if (session.ville && session.ville.trim() !== '') {
    const adresseComplete = session.lieu_formation ? `${session.lieu_formation}, ` : '';
    lieu = `${adresseComplete}${session.ville}${session.code_postal ? ` (${session.code_postal})` : ''}`;
    lieuDetermine = true;
  }

  // Formater la date de fin
  let dateFin = '';
  if (session.date_fin) {
    const datefinObj = new Date(session.date_fin);
    dateFin = datefinObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    dateFin = dateFin.charAt(0).toUpperCase() + dateFin.slice(1);
  }

  // Préparer la date complète pour le bouton de préinscription
  const sessionDateComplete = dateFormatted + (dateFin ? ' au ' + dateFin : '');

  sessionDetailView.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <!-- Bouton retour -->
      <button onclick="goToCalendar()" class="btn btn-default" style="margin-bottom: 2rem; display: inline-flex; align-items: center; gap: 0.5rem;">
        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Retour au calendrier
      </button>
      
      <!-- En-tête -->
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <h1 style="font-size: 2.5rem; font-weight: 700; color: hsl(var(--foreground)); margin: 0;">
            ${session.libelle_produit}
          </h1>
          <span style="display: inline-block; padding: 0.5rem 1rem; ${statutStyle} border-radius: 9999px; font-size: 0.875rem; font-weight: 600; text-transform: uppercase;">
            ${session.statut}
          </span>
        </div>
        <p style="color: hsl(var(--muted-foreground)); font-size: 1.125rem;">
          Référence: ${session.reference}
        </p>
      </div>
      
      <!-- Contenu principal -->
      <div class="session-detail-grid" style="display: grid; grid-template-columns: ${lieuDetermine ? '1fr 1fr' : '1fr'}; gap: 2rem; margin-bottom: 2rem;">
        <!-- Colonne gauche : Informations -->
        <div>
          <!-- Carte Informations principales -->
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-content" style="padding: 2rem;">
              <h2 style="font-size: 1.75rem; font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 1.5rem;">
                Informations de la session
              </h2>
              
              <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- Dates -->
                <div style="display: flex; align-items: start; gap: 1rem;">
                  <div style="padding: 0.75rem; background: hsl(var(--primary) / 0.1); border-radius: 0.5rem;">
                    <svg style="width: 1.5rem; height: 1.5rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div style="flex: 1;">
                    <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin: 0 0 0.25rem 0; text-transform: uppercase; font-weight: 600;">Dates</p>
                    <p style="font-size: 1.125rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">
                      Du ${dateFormatted}${dateFin ? `<br/>au ${dateFin}` : ''}
                    </p>
                  </div>
                </div>
                
                <!-- Lieu -->
                <div style="display: flex; align-items: start; gap: 1rem;">
                  <div style="padding: 0.75rem; background: hsl(var(--primary) / 0.1); border-radius: 0.5rem;">
                    <svg style="width: 1.5rem; height: 1.5rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin: 0 0 0.25rem 0; text-transform: uppercase; font-weight: 600;">Lieu</p>
                    <p style="font-size: 1.125rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">${lieu}</p>
                  </div>
                </div>
                
                <!-- Modalité -->
                <div style="display: flex; align-items: start; gap: 1rem;">
                  <div style="padding: 0.75rem; background: hsl(var(--primary) / 0.1); border-radius: 0.5rem;">
                    <svg style="width: 1.5rem; height: 1.5rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin: 0 0 0.25rem 0; text-transform: uppercase; font-weight: 600;">Modalité</p>
                    <p style="font-size: 1.125rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">${session.modalite}</p>
                  </div>
                </div>
                
                <!-- Durée -->
                ${session.duree_heures || session.duree_jours ? `
                <div style="display: flex; align-items: start; gap: 1rem;">
                  <div style="padding: 0.75rem; background: hsl(var(--primary) / 0.1); border-radius: 0.5rem;">
                    <svg style="width: 1.5rem; height: 1.5rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin: 0 0 0.25rem 0; text-transform: uppercase; font-weight: 600;">Durée</p>
                    <p style="font-size: 1.125rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">${session.duree_heures}${session.duree_jours ? ` (${session.duree_jours} jour${parseInt(session.duree_jours) > 1 ? 's' : ''})` : ''}</p>
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          
          <!-- Places disponibles -->
          ${session.publication_places ? `
          <div class="card">
            <div class="card-content" style="padding: 2rem; text-align: center;">
              <h3 style="font-size: 1.25rem; font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 1rem;">
                Places disponibles
              </h3>
              <div style="display: flex; justify-content: center; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 4rem; font-weight: 700; color: hsl(var(--primary)); line-height: 1;">${session.places_disponibles}</span>
                <span style="font-size: 1.5rem; color: hsl(var(--muted-foreground));">/ ${session.effectif_max}</span>
              </div>
              <p style="color: hsl(var(--muted-foreground)); font-size: 0.95rem;">
                ${session.places_disponibles > 0 ? 'Places encore disponibles pour cette session' : 'Session complète'}
              </p>
            </div>
          </div>
          ` : ''}
        </div>
        
        <!-- Colonne droite : Carte (uniquement si lieu déterminé) -->
        ${lieuDetermine ? `
        <div>
          <div class="card" style="height: 100%; min-height: 500px;">
            <div class="card-content" style="padding: 0; height: 100%; display: flex; flex-direction: column;">
              <div style="padding: 1.5rem; border-bottom: 2px solid hsl(var(--border));">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: hsl(var(--foreground)); margin: 0;">
                  Localisation
                </h2>
              </div>
              <div id="session-map" class="session-map-container" style="flex: 1; min-height: 400px; border-radius: 0 0 0.75rem 0.75rem; position: relative; background: hsl(var(--muted) / 0.1);">
                <!-- Loader -->
                <div id="map-loader" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 1000;">
                  <div style="width: 3rem; height: 3rem; border: 4px solid hsl(var(--border)); border-top-color: hsl(var(--primary)); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                  <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">Chargement de la carte...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
      
      <!-- Lien vers la formation -->
      ${formation ? `
      <div class="card">
        <div class="card-content" style="padding: 2.5rem;">
          <div class="session-formation-grid" style="display: grid; grid-template-columns: 1fr auto; gap: 3rem; align-items: start;">
            <!-- Informations formation -->
            <div>
              <h2 style="font-size: 1.75rem; font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 1.5rem;">
                À propos de cette formation
              </h2>
              
              <h3 style="font-size: 1.25rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 1rem;">
                ${formation.titre}
              </h3>
              
              ${formation.publicConcerne && formation.publicConcerne !== 'Tout public' ? `
              <p style="color: hsl(var(--muted-foreground)); margin-bottom: 1.5rem; font-size: 1rem; line-height: 1.6;">
                <strong>Public concerné :</strong> ${formation.publicConcerne}
              </p>
              ` : ''}
              
              <!-- Objectifs -->
              ${formation.objectifs && formation.objectifs.length > 0 ? `
              <div style="margin-bottom: 1.5rem;">
                <h4 style="font-size: 1rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                  <svg style="width: 1.25rem; height: 1.25rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Objectifs de la formation
                </h4>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
                  ${formation.objectifs.slice(0, 4).map(obj => `
                    <li style="display: flex; align-items: start; gap: 0.5rem; color: hsl(var(--muted-foreground)); font-size: 0.95rem;">
                      <span style="color: hsl(var(--primary)); font-weight: 700; margin-top: 0.125rem;">•</span>
                      <span>${obj}</span>
                    </li>
                  `).join('')}
                  ${formation.objectifs.length > 4 ? `
                    <li style="color: hsl(var(--primary)); font-size: 0.875rem; font-weight: 600; margin-top: 0.25rem;">
                      + ${formation.objectifs.length - 4} autre${formation.objectifs.length - 4 > 1 ? 's' : ''} objectif${formation.objectifs.length - 4 > 1 ? 's' : ''}
                    </li>
                  ` : ''}
                </ul>
              </div>
              ` : ''}
              
              <!-- Prix et informations -->
              <div style="display: flex; flex-direction: column; gap: 1.5rem; padding-top: 1rem; border-top: 1px solid hsl(var(--border));">
                <!-- Prix -->
                <div>
                  <h4 style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--muted-foreground)); margin: 0 0 0.75rem 0; text-transform: uppercase;">Tarifs</h4>
                  ${formation.prix && formation.prix.apprenant ? `
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg style="width: 1.125rem; height: 1.125rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span style="font-size: 0.95rem; color: hsl(var(--foreground));">
                          <strong>${formation.prix.apprenant} €</strong> <span style="color: hsl(var(--muted-foreground));">/ apprenant</span>
                        </span>
                      </div>
                    </div>
                  ` : `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <svg style="width: 1.125rem; height: 1.125rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span style="font-size: 0.95rem; color: hsl(var(--foreground));">
                        <strong>Nous consulter</strong>
                      </span>
                    </div>
                  `}
                </div>
                
                <!-- Badges CPF et Certification -->
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                  ${formation.cpf ? `
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: hsl(142, 76%, 36% / 0.1); border: 1px solid hsl(142, 76%, 36%); border-radius: 9999px;">
                      <svg style="width: 1rem; height: 1rem; color: hsl(142, 76%, 36%);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span style="font-size: 0.875rem; font-weight: 600; color: hsl(142, 76%, 36%);">Éligible CPF</span>
                    </div>
                  ` : `
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: hsl(var(--muted) / 0.3); border: 1px solid hsl(var(--border)); border-radius: 9999px;">
                      <svg style="width: 1rem; height: 1rem; color: hsl(var(--muted-foreground));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <span style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--muted-foreground));">Non éligible CPF</span>
                    </div>
                  `}
                  
                  ${formation.certification && formation.certification.estCertifiante ? `
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: hsl(var(--primary) / 0.1); border: 1px solid hsl(var(--primary)); border-radius: 9999px;">
                      <svg style="width: 1rem; height: 1rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                      </svg>
                      <span style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--primary));">Formation certifiante</span>
                    </div>
                  ` : `
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: hsl(var(--muted) / 0.3); border: 1px solid hsl(var(--border)); border-radius: 9999px;">
                      <span style="font-size: 0.875rem; font-weight: 600; color: hsl(var(--muted-foreground));">Formation non certifiante</span>
                    </div>
                  `}
                </div>
              </div>
            </div>
            
            <!-- Bouton CTA -->
            <div style="display: flex; align-items: center; justify-content: center; min-width: 250px;">
              <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem;">
                <button onclick="openPreinscriptionFromSession('${session.reference.replace(/'/g, "\\'")}','${session.libelle_produit.replace(/'/g, "\\'")}', '${sessionDateComplete.replace(/'/g, "\\'")}','${lieu.replace(/'/g, "\\'")}', getProductReferenceFromCode('${session.code_produit}'))" style="
                  padding: 1.5rem 2rem;
                  background: hsl(var(--primary));
                  color: white;
                  border: none;
                  border-radius: 0.75rem;
                  font-size: 1.125rem;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.75rem;
                  text-align: center;
                  width: 100%;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 15px 30px -5px hsl(var(--primary) / 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 25px -5px hsl(var(--primary) / 0.3)';">
                  <svg style="width: 2rem; height: 2rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Se préinscrire à cette session</span>
                </button>
                <button onclick="showFormationDetail('${formation.id}')" style="
                  padding: 1rem 1.5rem;
                  background: transparent;
                  color: hsl(var(--primary));
                  border: 2px solid hsl(var(--primary));
                  border-radius: 0.75rem;
                  font-size: 1rem;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.5rem;
                  text-align: center;
                  width: 100%;
                " onmouseover="this.style.background='hsl(var(--primary) / 0.05)';" onmouseout="this.style.background='transparent';">
                  <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>Voir la fiche formation complète</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  `;

  // Initialiser la carte après le rendu (uniquement si lieu déterminé)
  if (lieuDetermine) {
    setTimeout(() => initSessionMap(session), 100);
  }
}

// Initialiser la carte Leaflet pour une session
async function initSessionMap(session) {
  const mapContainer = document.getElementById('session-map');
  const loader = document.getElementById('map-loader');
  if (!mapContainer) return;

  // Géocoder l'adresse si on a une ville
  let lat = 48.8566; // Paris par défaut
  let lon = 2.3522;

  if (session.ville) {
    try {
      // Utiliser l'API Nominatim d'OpenStreetMap pour géocoder
      const query = `${session.ville}${session.code_postal ? `, ${session.code_postal}` : ''}, France`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lon = parseFloat(data[0].lon);
      }
    } catch (error) {
      console.warn('Erreur de géocodage:', error);
    }
  }

  // Créer la carte
  const map = L.map('session-map').setView([lat, lon], 13);

  // Ajouter les tuiles CartoDB Positron (style moderne et épuré)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Créer une icône personnalisée avec la couleur primaire
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <svg width="40" height="50" viewBox="0 0 40 50" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
          <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 30 20 30s20-16 20-30C40 8.954 31.046 0 20 0z" fill="hsl(var(--primary))"/>
          <circle cx="20" cy="20" r="8" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50]
  });

  // Ajouter un marqueur avec l'icône personnalisée
  const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

  // Popup avec les informations et numéro de session
  const popupContent = `
    <div style="text-align: center; padding: 0.75rem;">
      <strong style="font-size: 1.125rem; color: hsl(var(--foreground)); display: block; margin-bottom: 0.5rem;">${session.libelle_produit}</strong>
      <span style="color: hsl(var(--muted-foreground)); font-size: 0.95rem; display: block; margin-bottom: 0.5rem;">${session.ville || 'Lieu à définir'}</span>
      <span style="display: inline-block; padding: 0.25rem 0.75rem; background: hsl(var(--primary)); color: white; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
        Session ${session.reference}
      </span>
    </div>
  `;
  marker.bindPopup(popupContent).openPopup();

  // Masquer le loader
  if (loader) {
    loader.style.display = 'none';
  }

  // Forcer le redimensionnement de la carte
  setTimeout(() => map.invalidateSize(), 200);
}

// Variables globales pour le menu
let isMenuOpen = false;

// Initialiser les événements du menu - VERSION MINIMALISTE
function initSubmenuEvents() {
  console.log('🎯 Initialisation du menu (version minimaliste)...');

  // 1. Gérer le positionnement intelligent des sous-menus (flip à gauche si nécessaire)
  const itemsWithSubmenu = document.querySelectorAll('.dropdown-item.has-submenu');
  itemsWithSubmenu.forEach(item => {
    item.addEventListener('mouseenter', function () {
      const submenu = this.querySelector(':scope > .dropdown-submenu');
      if (submenu) {
        // Attendre que le sous-menu soit visible
        setTimeout(() => {
          const rect = submenu.getBoundingClientRect();
          const windowWidth = window.innerWidth;

          // Si le sous-menu dépasse à droite, le positionner à gauche
          if (rect.right > windowWidth - 10) {
            submenu.classList.add('flip-left');
          } else {
            submenu.classList.remove('flip-left');
          }
        }, 50);
      }
    });
  });

  // 2. Gérer les clics sur les éléments pour le filtrage
  const allDropdownItems = document.querySelectorAll('.dropdown-item[data-type]');
  allDropdownItems.forEach(item => {
    item.addEventListener('click', function (e) {
      const type = this.getAttribute('data-type');
      const value = this.getAttribute('data-value');
      if (type && value) {
        e.stopPropagation();
        console.log('✅ Filtre appliqué:', type, value);
        filterByHierarchy(type, value);

        // Fermer le menu après le clic
        const mainMenu = document.querySelector('.dropdown-menu');
        if (mainMenu) {
          mainMenu.classList.remove('show');
        }
      }
    });
  });

  // 2. Gérer le toggle du bouton Catalogue
  const catalogueBtn = document.querySelector('.dropdown-toggle');
  const mainMenu = document.querySelector('.dropdown-menu');

  if (catalogueBtn && mainMenu) {
    catalogueBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      isMenuOpen = !isMenuOpen;

      if (isMenuOpen) {
        mainMenu.classList.add('show');
        console.log('📂 Menu ouvert');
      } else {
        mainMenu.classList.remove('show');
        console.log('📁 Menu fermé');
      }
    });
  }

  // 3. Fermer le menu quand on clique ailleurs
  document.addEventListener('click', function (e) {
    const dropdown = document.querySelector('.dropdown');
    const catalogueButton = document.querySelector('.dropdown-toggle');

    // Ignorer si on clique sur le bouton
    if (catalogueButton && catalogueButton.contains(e.target)) {
      return;
    }

    // Fermer si on clique en dehors
    const clickedInside = dropdown && dropdown.contains(e.target);
    if (!clickedInside && isMenuOpen) {
      if (mainMenu) {
        mainMenu.classList.remove('show');
        isMenuOpen = false;
        console.log('📁 Menu fermé (clic extérieur)');
      }
    }
  });

  console.log('✅ Menu initialisé');
}

// Afficher la page des indicateurs de qualité
function showIndicateursQualite(event, formationReference) {
  event.preventDefault();

  console.log('🔍 Affichage des indicateurs de qualité pour:', formationReference);

  // Trouver la formation
  const formation = formationsData.find(f => f.reference === formationReference);
  if (!formation) {
    console.error('❌ Formation non trouvée:', formationReference);
    return;
  }

  const catalogueView = document.getElementById('catalogue-view');
  const produitView = document.getElementById('produit-view');

  // Masquer les autres vues
  catalogueView.classList.add('hidden');
  produitView.classList.add('hidden');

  // Créer la vue si elle n'existe pas
  let indicateursView = document.getElementById('indicateurs-view');
  if (!indicateursView) {
    console.log('📄 Création de la vue indicateurs');
    indicateursView = createIndicateursView(formation);
  } else {
    // Mettre à jour le contenu avec les nouvelles données
    indicateursView.remove();
    indicateursView = createIndicateursView(formation);
  }

  // Afficher la vue indicateurs
  indicateursView.classList.remove('hidden');

  // Stocker la référence de la formation pour le retour
  indicateursView.dataset.formationReference = formationReference;

  console.log('✅ Vue indicateurs affichée');

  // Scroll en haut
  window.scrollTo(0, 0);
}

// Créer la vue des indicateurs de qualité
function createIndicateursView(formation) {
  const main = document.querySelector('main');
  const indicateursView = document.createElement('div');
  indicateursView.id = 'indicateurs-view';
  indicateursView.className = 'hidden';

  // Calculer les moyennes de chaque indicateur sur TOUTES les formations
  const calculerMoyenne = (formations, extracteur) => {
    const valeurs = formations.map(extracteur).filter(val => val > 0);
    return valeurs.length > 0
      ? Math.round(valeurs.reduce((sum, val) => sum + val, 0) / valeurs.length)
      : 0;
  };

  const moyenneObjectifs = calculerMoyenne(formationsData, f => f.avis.objectifs);
  const moyenneContenu = calculerMoyenne(formationsData, f => f.avis.contenu);
  const moyennePedagogie = calculerMoyenne(formationsData, f => f.avis.pedagogie);
  const moyenneIntervenant = calculerMoyenne(formationsData, f => f.avis.intervenant);
  const moyenneParticipation = calculerMoyenne(formationsData, f => f.resultats.participation);
  const moyenneReussite = calculerMoyenne(formationsData, f => f.resultats.reussite);

  // Calculer la moyenne globale des 6 moyennes
  const moyennes = [
    moyenneObjectifs,
    moyenneContenu,
    moyennePedagogie,
    moyenneIntervenant,
    moyenneParticipation,
    moyenneReussite
  ];

  const moyennesValides = moyennes.filter(val => val > 0);
  const moyenneGlobale = moyennesValides.length > 0
    ? Math.round(moyennesValides.reduce((sum, val) => sum + val, 0) / moyennesValides.length)
    : 0;

  // Date de mise à jour (veille du jour actuel)
  const aujourdhui = new Date();
  const hier = new Date(aujourdhui);
  hier.setDate(hier.getDate() - 1);
  const dateMaj = hier.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  indicateursView.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <!-- Bouton retour -->
      <button onclick="retourFormation()" class="btn btn-outline mb-6" style="display: inline-flex; align-items: center; gap: 0.5rem;">
        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Retour à la formation
      </button>
      
      <!-- Titre principal -->
      <h1 style="font-size: 2.5rem; font-weight: 700; color: hsl(var(--primary)); margin-bottom: 2rem;">
        Des indicateurs pour juger de la qualité de nos formations
      </h1>
      
      <!-- Contenu -->
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-content" style="padding: 2rem;">
          <p style="font-size: 1rem; line-height: 1.8; color: hsl(var(--foreground)); margin-bottom: 1.5rem;">
            Chez <strong>${organismData.nomOrganisme}</strong>, nous sommes soucieux de la qualité des prestations que nous délivrons. C'est pourquoi chacune des sessions de formation que nous délivrons fait l'objet d'une <strong>enquête de satisfaction auprès des apprenants</strong>. Nous collectons ainsi continuellement des données qui contribuent à <strong>l'amélioration continue</strong> de nos services. Nous rendons par ailleurs ces données publiques sous la forme de 6 grands indicateurs consultables directement depuis la page de la prestation qui vous intéresse.
          </p>
          
          <h2 style="font-size: 1.75rem; font-weight: 700; color: hsl(var(--foreground)); margin-top: 2rem; margin-bottom: 1.5rem;">
            Quels sont ces indicateurs ? Et que signifient-ils ?
          </h2>
          
          <p style="font-size: 1rem; line-height: 1.8; color: hsl(var(--foreground)); margin-bottom: 1rem;">
            Nos indicateurs se concentrent sur <strong>4 paramètres essentiels concourant à la réussite d'une action de formation</strong> à savoir <strong>les objectifs</strong> de l'action de formation, <strong>le contenu</strong> de la formation, <strong>les méthodes pédagogiques</strong> employées au cours de l'action de formation et enfin <strong>l'intervenant</strong> ayant animé la formation.
          </p>
          
          <p style="font-size: 1rem; line-height: 1.8; color: hsl(var(--foreground)); margin-bottom: 1rem;">
            Les participants donnent leur avis sur ces différents points à travers une série de questions et les données, une fois compilées, nous permettent d'établir des indicateurs sous forme de <strong>taux de satisfaction</strong>.
          </p>
          
          <p style="font-size: 1rem; line-height: 1.8; color: hsl(var(--foreground));">
            À ces 4 indicateurs de satisfaction s'ajoutent 2 indicateurs de résultats : le <strong>taux de participation</strong>, qui mesure l'assiduité des apprenants, et le <strong>taux de réussite</strong>, qui évalue l'atteinte des objectifs pédagogiques. Les valeurs présentées ci-dessous correspondent à <strong>la moyenne de l'ensemble des sessions réalisées</strong> pour chacune de nos formations.
          </p>
        </div>
      </div>
      
      <!-- Les 6 indicateurs -->
      
      <!-- Indicateurs de satisfaction (4) -->
      <div style="background: hsl(var(--primary) / 0.05); padding: 2rem; border-radius: 0.75rem; margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
          <svg style="width: 1.75rem; height: 1.75rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: hsl(var(--foreground)); margin: 0;">
            Indicateurs de satisfaction
          </h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
          <!-- Satisfaction Objectifs -->
          <div class="card">
            <div class="card-content" style="padding: 1.5rem; text-align: center;">
              <div style="font-size: 3rem; font-weight: 700; color: hsl(var(--primary)); margin-bottom: 0.5rem;">
                ${moyenneObjectifs}%
              </div>
              <h3 style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">
                Objectifs
              </h3>
            </div>
          </div>
          
          <!-- Satisfaction Contenu -->
          <div class="card">
            <div class="card-content" style="padding: 1.5rem; text-align: center;">
              <div style="font-size: 3rem; font-weight: 700; color: hsl(var(--primary)); margin-bottom: 0.5rem;">
                ${moyenneContenu}%
              </div>
              <h3 style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">
                Contenu
              </h3>
            </div>
          </div>
          
          <!-- Satisfaction Pédagogie -->
          <div class="card">
            <div class="card-content" style="padding: 1.5rem; text-align: center;">
              <div style="font-size: 3rem; font-weight: 700; color: hsl(var(--primary)); margin-bottom: 0.5rem;">
                ${moyennePedagogie}%
              </div>
              <h3 style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">
                Pédagogie
              </h3>
            </div>
          </div>
          
          <!-- Satisfaction Intervenant -->
          <div class="card">
            <div class="card-content" style="padding: 1.5rem; text-align: center;">
              <div style="font-size: 3rem; font-weight: 700; color: hsl(var(--primary)); margin-bottom: 0.5rem;">
                ${moyenneIntervenant}%
              </div>
              <h3 style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">
                Intervenant
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Indicateurs de résultats (2) -->
      <div style="background: hsl(var(--primary) / 0.05); padding: 2rem; border-radius: 0.75rem; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
          <svg style="width: 1.75rem; height: 1.75rem; color: hsl(var(--primary));" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: hsl(var(--foreground)); margin: 0;">
            Indicateurs de résultats
          </h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
          <!-- Taux de Participation -->
          <div class="card">
            <div class="card-content" style="padding: 1.5rem; text-align: center;">
              <div style="font-size: 3rem; font-weight: 700; color: hsl(var(--primary)); margin-bottom: 0.5rem;">
                ${moyenneParticipation}%
              </div>
              <h3 style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">
                Taux de Participation
              </h3>
            </div>
          </div>
          
          <!-- Taux de Réussite -->
          <div class="card">
            <div class="card-content" style="padding: 1.5rem; text-align: center;">
              <div style="font-size: 3rem; font-weight: 700; color: hsl(var(--primary)); margin-bottom: 0.5rem;">
                ${moyenneReussite}%
              </div>
              <h3 style="font-size: 0.95rem; font-weight: 600; color: hsl(var(--foreground)); margin: 0;">
                Taux de Réussite
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Date de mise à jour -->
      <p style="text-align: right; font-size: 0.875rem; color: hsl(var(--muted-foreground)); font-style: italic; margin-bottom: 3rem;">
        Données mises à jour au ${dateMaj}
      </p>
      
      <!-- Bouton d'action -->
      <div style="text-align: center; margin-top: 3rem;">
        <button onclick="retourFormation()" class="btn btn-default" style="background: hsl(var(--primary)); color: white; padding: 1rem 2.5rem; font-size: 1.125rem; font-weight: 600;">
          <svg style="width: 1.5rem; height: 1.5rem; display: inline; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Retour à la fiche formation
        </button>
      </div>
    </div>
  `;

  main.appendChild(indicateursView);
  return indicateursView;
}

// ============================================
// Gestion du Formulaire de Contact
// ============================================

// Basculer entre Particulier et Entreprise
function switchUserType(type) {
  const userTypeInput = document.getElementById('user-type');
  const particulierFields = document.getElementById('particulier-fields');
  const entrepriseFields = document.getElementById('entreprise-fields');
  const toggleButtons = document.querySelectorAll('.toggle-option');
  const formType = document.getElementById('form-type').value;

  // Mettre à jour le champ caché
  userTypeInput.value = type;

  // Mettre à jour l'apparence des boutons
  toggleButtons.forEach(btn => {
    if (btn.dataset.type === type) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Afficher/masquer les champs appropriés
  if (type === 'particulier') {
    particulierFields.style.display = 'block';
    entrepriseFields.style.display = 'none';

    // Gérer les champs requis pour particulier
    updateRequiredFields(formType, 'particulier');
  } else {
    particulierFields.style.display = 'none';
    entrepriseFields.style.display = 'block';

    // Gérer les champs requis pour entreprise
    updateRequiredFields(formType, 'entreprise');
  }
}

// Mettre à jour les champs requis selon le contexte
function updateRequiredFields(formType, userType) {
  if (userType === 'particulier') {
    const phoneMobileRequired = document.getElementById('phone-mobile-required');
    const messageRequired = document.getElementById('message-required');
    const phoneMobileInput = document.getElementById('contact-phone-mobile');
    const messageInput = document.getElementById('contact-message');

    if (formType === 'preinscription') {
      // Téléphone portable obligatoire pour préinscription
      phoneMobileRequired.style.display = 'inline';
      phoneMobileInput.required = true;
      // Message facultatif
      messageRequired.style.display = 'none';
      messageInput.required = false;
    } else {
      // Téléphone portable facultatif pour devis
      phoneMobileRequired.style.display = 'none';
      phoneMobileInput.required = false;
      // Message obligatoire
      messageRequired.style.display = 'inline';
      messageInput.required = true;
    }
  } else {
    const companyPhoneMobileRequired = document.getElementById('company-phone-mobile-required');
    const companyMessageRequired = document.getElementById('company-message-required');
    const companyPhoneMobileInput = document.getElementById('company-phone-mobile');
    const companyMessageInput = document.getElementById('company-message');
    const participantCountGroup = document.getElementById('participant-count-group');
    const participantListGroup = document.getElementById('participant-list-group');

    if (formType === 'preinscription') {
      // Téléphone portable obligatoire pour préinscription
      companyPhoneMobileRequired.style.display = 'inline';
      companyPhoneMobileInput.required = true;
      // Message facultatif
      companyMessageRequired.style.display = 'none';
      companyMessageInput.required = false;
      // Afficher liste participants au lieu du nombre
      participantCountGroup.style.display = 'none';
      participantListGroup.style.display = 'block';
    } else {
      // Téléphone portable facultatif pour devis
      companyPhoneMobileRequired.style.display = 'none';
      companyPhoneMobileInput.required = false;
      // Message obligatoire
      companyMessageRequired.style.display = 'inline';
      companyMessageInput.required = true;
      // Afficher nombre de participants
      participantCountGroup.style.display = 'block';
      participantListGroup.style.display = 'none';
    }
  }
}

// Ouvrir la modale de contact pour une demande de devis
function openDevisModal(formationName, productReference = '', defaultTab = 'particulier', emptyMessage = false) {
  const modal = document.getElementById('contact-modal');
  const modalTitle = document.getElementById('modal-title');
  const formType = document.getElementById('form-type');
  const formationInput = document.getElementById('formation-name');
  const productReferenceInput = document.getElementById('product-reference');
  const sessionInfo = document.getElementById('session-info');
  const preinscriptionNotice = document.getElementById('preinscription-notice');
  const contactMessage = document.getElementById('contact-message');

  // Configuration pour devis
  modalTitle.textContent = 'Demande de Devis';
  formType.value = 'devis';
  formationInput.value = formationName;
  productReferenceInput.value = productReference;
  sessionInfo.style.display = 'none';
  preinscriptionNotice.style.display = 'none';

  // Réinitialiser le formulaire
  document.getElementById('contact-form').reset();
  document.getElementById('form-message').style.display = 'none';

  // Remettre les valeurs des champs cachés
  formType.value = 'devis';
  formationInput.value = formationName;
  productReferenceInput.value = productReference;
  document.getElementById('user-type').value = defaultTab;

  // Pré-remplir le message pour devis
  if (emptyMessage) {
    contactMessage.value = '';
  } else {
    contactMessage.value = `Bonjour, je souhaiterais recevoir un devis pour la formation ${formationName}.`;
  }

  // Init toggle
  switchUserType(defaultTab);

  // Ouvrir la modale
  modal.showModal();
}

// Ouvrir la modale de contact pour une préinscription
function openPreinscriptionModal(formationName, sessionDate, sessionLieu, sessionReference = '', productReference = '') {
  const modal = document.getElementById('contact-modal');
  const modalTitle = document.getElementById('modal-title');
  const formType = document.getElementById('form-type');
  const formationInput = document.getElementById('formation-name');
  const productReferenceInput = document.getElementById('product-reference');
  const sessionDateInput = document.getElementById('session-date');
  const sessionLieuInput = document.getElementById('session-lieu');
  const sessionReferenceInput = document.getElementById('session-reference');
  const sessionInfo = document.getElementById('session-info');
  const sessionInfoText = document.getElementById('session-info-text');
  const sessionReferenceText = document.getElementById('session-reference-text');
  const preinscriptionNotice = document.getElementById('preinscription-notice');

  // Configuration pour préinscription
  modalTitle.textContent = 'Demande de Préinscription';
  formType.value = 'preinscription';
  formationInput.value = formationName;
  productReferenceInput.value = productReference;
  sessionDateInput.value = sessionDate;
  sessionLieuInput.value = sessionLieu;
  sessionReferenceInput.value = sessionReference;

  // Afficher le badge de référence
  if (sessionReference) {
    sessionReferenceText.textContent = sessionReference;
  } else {
    sessionReferenceText.textContent = 'SESSION';
  }

  // Afficher les infos de session
  sessionInfo.style.display = 'block';
  let infoHTML = `<div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
    <div style="flex: 1;">
      <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">${formationName}</div>
      <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.95rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0; color: hsl(var(--primary));">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span><strong>Date :</strong> ${sessionDate}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0; color: hsl(var(--primary));">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span><strong>Lieu :</strong> ${sessionLieu}</span>
        </div>
      </div>
    </div>
  </div>`;
  sessionInfoText.innerHTML = infoHTML;

  // Afficher la notice de préinscription
  preinscriptionNotice.style.display = 'flex';

  // Réinitialiser le formulaire
  document.getElementById('contact-form').reset();
  document.getElementById('form-message').style.display = 'none';

  // Remettre les valeurs des champs cachés
  formType.value = 'preinscription';
  formationInput.value = formationName;
  productReferenceInput.value = productReference;
  sessionDateInput.value = sessionDate;
  sessionLieuInput.value = sessionLieu;
  sessionReferenceInput.value = sessionReference;
  document.getElementById('user-type').value = 'particulier';

  // Réinitialiser le toggle sur Particulier
  switchUserType('particulier');

  // Ouvrir la modale
  modal.showModal();
}

// Fermer la modale de contact
function closeContactModal() {
  const modal = document.getElementById('contact-modal');
  modal.close();
}

// Ouvrir la préinscription depuis la page de détail de session
function openPreinscriptionFromSession(sessionReference, formationName, sessionDate, sessionLieu, productReference = '') {
  openPreinscriptionModal(formationName, sessionDate, sessionLieu, sessionReference, productReference);
}

// Trouver la référence PRO- d'une formation à partir de son code_produit
function getProductReferenceFromCode(codeProduit) {
  if (!codeProduit) return '';
  const formation = formationsData.find(f => f.code_produit === codeProduit);
  return formation ? formation.reference : '';
}

// ============================================
// Formatage des Champs de Texte
// ============================================

// Formater le nom de famille en MAJUSCULES
function formatLastName(text) {
  return text.trim().toUpperCase();
}

// Formater le prénom avec première lettre en majuscule
function formatFirstName(text) {
  text = text.trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Formater le nom de ville en MAJUSCULES
function formatCityName(text) {
  return text.trim().toUpperCase();
}

// ============================================
// Navigation au Clavier dans les Suggestions
// ============================================

let selectedSuggestionIndex = -1;

// Gérer la navigation au clavier dans un dropdown de suggestions
function handleKeyboardNavigation(e, suggestionsDiv, inputElement, onSelect) {
  const suggestions = suggestionsDiv.querySelectorAll('.suggestion-item');

  if (suggestions.length === 0) return;

  // Flèche bas
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
    updateSelectedSuggestion(suggestions);
  }

  // Flèche haut
  else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
    updateSelectedSuggestion(suggestions);
  }

  // Entrée
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
      suggestions[selectedSuggestionIndex].click();
    }
  }

  // Échap
  else if (e.key === 'Escape') {
    suggestionsDiv.style.display = 'none';
    selectedSuggestionIndex = -1;
  }
}

// Mettre à jour la suggestion sélectionnée visuellement
function updateSelectedSuggestion(suggestions) {
  suggestions.forEach((item, index) => {
    if (index === selectedSuggestionIndex) {
      item.classList.add('suggestion-selected');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      item.classList.remove('suggestion-selected');
    }
  });
}

// Réinitialiser l'index de sélection
function resetSuggestionSelection() {
  selectedSuggestionIndex = -1;
}

// ============================================
// API Sirene (Recherche d'Entreprises)
// ============================================

let searchTimeout = null;

// Rechercher une entreprise par nom
async function searchCompanyByName(query) {
  if (query.length < 3) return;

  const suggestionsDiv = document.getElementById('company-suggestions');
  suggestionsDiv.innerHTML = '<div class="suggestions-loading">Recherche en cours...</div>';
  suggestionsDiv.style.display = 'block';

  try {
    const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=5`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      suggestionsDiv.innerHTML = '';
      data.results.forEach(company => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <div class="suggestion-item-name">${company.nom_complet || company.nom_raison_sociale}</div>
          <div class="suggestion-item-address">${formatAddress(company.siege)}</div>
          <div class="suggestion-item-address">${[company.siege.code_postal, company.siege.libelle_commune].filter(Boolean).join(' ')}</div>
          <div class="suggestion-item-siret">SIRET: ${company.siege.siret}</div>
        `;
        item.onclick = () => selectCompany(company);
        suggestionsDiv.appendChild(item);
      });
    } else {
      suggestionsDiv.innerHTML = '<div class="suggestions-empty">Aucune entreprise trouvée</div>';
    }
  } catch (error) {
    console.error('Erreur API Sirene:', error);
    suggestionsDiv.innerHTML = '<div class="suggestions-empty">Erreur de recherche</div>';
  }
}

// Rechercher une entreprise par SIRET
async function searchCompanyBySiret(siret) {
  if (siret.length !== 14) return;

  const suggestionsDiv = document.getElementById('company-suggestions');
  suggestionsDiv.innerHTML = '<div class="suggestions-loading">Recherche par SIRET...</div>';
  suggestionsDiv.style.display = 'block';

  try {
    const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Réponse API SIRET:', data);

    if (data.results && data.results.length > 0) {
      const company = data.results[0];
      console.log('Entreprise trouvée:', company);
      fillCompanyFields(company);
      suggestionsDiv.innerHTML = '<div class="suggestions-empty" style="color: #22c55e;">✓ Entreprise trouvée et champs remplis</div>';
      setTimeout(() => {
        suggestionsDiv.style.display = 'none';
      }, 2000);
    } else {
      console.log('Aucun résultat pour le SIRET:', siret);
      suggestionsDiv.innerHTML = '<div class="suggestions-empty">SIRET non trouvé. Vous pouvez remplir les champs manuellement.</div>';
      setTimeout(() => {
        suggestionsDiv.style.display = 'none';
      }, 4000);
    }

  } catch (error) {
    console.error('Erreur API Sirene:', error);
    suggestionsDiv.innerHTML = '<div class="suggestions-empty">Recherche impossible. Remplissez les champs manuellement.</div>';
    setTimeout(() => {
      suggestionsDiv.style.display = 'none';
    }, 4000);
  }
}

// Sélectionner une entreprise depuis les suggestions
function selectCompany(company) {
  fillCompanyFields(company);
  document.getElementById('company-suggestions').style.display = 'none';
}

// Remplir les champs avec les données de l'entreprise
function fillCompanyFields(company) {
  document.getElementById('company-name').value = company.nom_complet || company.nom_raison_sociale;
  document.getElementById('company-siret').value = company.siege.siret;
  document.getElementById('company-address-street').value = formatAddress(company.siege);
  document.getElementById('company-postal-code').value = company.siege.code_postal || '';
  document.getElementById('company-city').value = formatCityName(company.siege.libelle_commune || '');
}

// Formater l'adresse
function formatAddress(siege) {
  const parts = [];
  if (siege.numero_voie) parts.push(siege.numero_voie);
  if (siege.type_voie) parts.push(siege.type_voie);
  if (siege.libelle_voie) parts.push(siege.libelle_voie);
  if (siege.complement_adresse) parts.push(siege.complement_adresse);
  return parts.join(' ');
}

// Formater l'adresse complète avec code postal et ville
function formatFullAddress(siege) {
  const street = formatAddress(siege);
  const parts = [street];
  if (siege.code_postal) parts.push(siege.code_postal);
  if (siege.libelle_commune) parts.push(siege.libelle_commune);
  return parts.join(', ');
}

// ============================================
// API Géolocalisation des Villes (geo.api.gouv.fr)
// ============================================

let citySearchTimeout = null;

// Rechercher des villes par code postal
async function searchCitiesByPostalCode(postalCode, targetCityInput, targetSuggestionsDiv) {
  if (postalCode.length !== 5) return;

  targetSuggestionsDiv.innerHTML = '<div class="suggestions-loading">Recherche en cours...</div>';
  targetSuggestionsDiv.style.display = 'block';

  try {
    const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux&format=json`);
    const data = await response.json();

    if (data && data.length > 0) {
      targetSuggestionsDiv.innerHTML = '';
      data.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `<div class="suggestion-item-name">${city.nom}</div>`;
        item.onclick = () => {
          targetCityInput.value = formatCityName(city.nom);
          targetSuggestionsDiv.style.display = 'none';
        };
        targetSuggestionsDiv.appendChild(item);
      });
    } else {
      targetSuggestionsDiv.innerHTML = '<div class="suggestions-empty">Aucune ville trouvée</div>';
    }
  } catch (error) {
    console.error('Erreur API Géo:', error);
    targetSuggestionsDiv.innerHTML = '<div class="suggestions-empty">Erreur de recherche</div>';
  }
}

// Rechercher des villes par nom
async function searchCitiesByName(cityName, targetCityInput, targetPostalCodeInput, targetSuggestionsDiv) {
  if (cityName.length < 2) return;

  targetSuggestionsDiv.innerHTML = '<div class="suggestions-loading">Recherche en cours...</div>';
  targetSuggestionsDiv.style.display = 'block';

  try {
    const response = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(cityName)}&fields=nom,code,codesPostaux&format=json&limit=10`);
    const data = await response.json();

    if (data && data.length > 0) {
      targetSuggestionsDiv.innerHTML = '';
      data.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        const postalCodes = city.codesPostaux ? city.codesPostaux.join(', ') : '';
        item.innerHTML = `
          <div class="suggestion-item-name">${city.nom}</div>
          <div class="suggestion-item-address">${postalCodes}</div>
        `;
        item.onclick = () => {
          targetCityInput.value = formatCityName(city.nom);
          targetPostalCodeInput.value = city.codesPostaux ? city.codesPostaux[0] : '';
          targetSuggestionsDiv.style.display = 'none';
        };
        targetSuggestionsDiv.appendChild(item);
      });
    } else {
      targetSuggestionsDiv.innerHTML = '<div class="suggestions-empty">Aucune ville trouvée</div>';
    }
  } catch (error) {
    console.error('Erreur API Géo:', error);
    targetSuggestionsDiv.innerHTML = '<div class="suggestions-empty">Erreur de recherche</div>';
  }
}

// Fermer la modale de succès
function closeSuccessModal() {
  const successModal = document.getElementById('success-modal');
  successModal.close();
}

// Retourner à la fiche formation
function retourFormation() {
  const indicateursView = document.getElementById('indicateurs-view');
  const formationReference = indicateursView.dataset.formationReference;

  console.log('🔙 Retour à la formation:', formationReference);

  // Masquer la vue indicateurs
  indicateursView.classList.add('hidden');

  // Retrouver et afficher la formation
  const formation = formationsData.find(f => f.reference === formationReference);
  if (formation) {
    console.log('✅ Formation trouvée:', formation.titre);
    showFormationDetail(formation.id);
  } else {
    console.error('❌ Formation non trouvée avec la référence:', formationReference);
  }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', init);
