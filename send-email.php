<?php
// ============================================
// Configuration Mailgun
// ============================================
$MAILGUN_API_KEY = getenv('MAILGUN_API_KEY') ?: 'VOTRE_CLE_API_MAILGUN';
$MAILGUN_DOMAIN = getenv('MAILGUN_DOMAIN') ?: 'argalis.fr';

// Variables par défaut (seront écrasées par les données reçues du JavaScript)
$RECIPIENT_EMAIL = 'contact@votredomaine.com';
$PRIMARY_COLOR = '#DC2626';
$PRIMARY_DARK = '#991B1B';
$PRIMARY_LIGHT = '#FEE2E2';
$ORGANISM_NAME = 'Notre organisme';
$ORGANISM_LOGO = '';
$ORGANISM_EMAIL = '';
$ORGANISM_PHONE = '';
$ORGANISM_ADDRESS = '';

// Fonction pour assombrir une couleur hex
function adjustColor($color, $percent) {
    $color = str_replace('#', '', $color);
    $rgb = array_map('hexdec', str_split($color, 2));
    
    if ($percent > 0) {
        // Pour éclaircir : interpoler vers le blanc (255, 255, 255)
        foreach ($rgb as &$value) {
            $value = round($value + (255 - $value) * ($percent / 100));
            $value = max(0, min(255, $value));
        }
    } else {
        // Pour assombrir : soustraire
        foreach ($rgb as &$value) {
            $value = max(0, min(255, $value + round(2.55 * $percent)));
        }
    }
    
    return '#' . implode('', array_map(function($val) {
        return str_pad(dechex($val), 2, '0', STR_PAD_LEFT);
    }, $rgb));
}

// ============================================
// Configuration CORS et Sécurité
// ============================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Vérifier que la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée. Utilisez POST.'
    ]);
    exit();
}

// ============================================
// Fonctions de Formatage
// ============================================

// Formater le nom de famille en MAJUSCULES
function formatLastName($text) {
    return mb_strtoupper(trim($text), 'UTF-8');
}

// Formater le prénom avec première lettre en majuscule
function formatFirstName($text) {
    $text = mb_strtolower(trim($text), 'UTF-8');
    return mb_strtoupper(mb_substr($text, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($text, 1, null, 'UTF-8');
}

// Formater le nom de ville en MAJUSCULES
function formatCityName($text) {
    return mb_strtoupper(trim($text), 'UTF-8');
}

// ============================================
// Récupération et Validation des Données
// ============================================
$input = file_get_contents('php://input');
$json = $input;
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Données JSON invalides.'
    ]);
    exit();
}

// Vérifier que les données JSON sont valides
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Données JSON invalides.'
    ]);
    exit();
}

// Récupérer les données de l'organisme depuis le payload
if (isset($data['organism'])) {
    $organism = $data['organism'];
    
    if (isset($organism['nomOrganisme'])) {
        $ORGANISM_NAME = $organism['nomOrganisme'];
    }
    if (isset($organism['logoUrl'])) {
        $ORGANISM_LOGO = $organism['logoUrl'];
    }
    if (isset($organism['couleurPrincipale'])) {
        $PRIMARY_COLOR = $organism['couleurPrincipale'];
        $PRIMARY_DARK = adjustColor($PRIMARY_COLOR, -20);
        $PRIMARY_LIGHT = adjustColor($PRIMARY_COLOR, 95); // 95% vers le blanc = 5% d'opacité de la couleur
        
        // Log pour déboguer les couleurs
        error_log("PRIMARY_COLOR: $PRIMARY_COLOR");
        error_log("PRIMARY_DARK: $PRIMARY_DARK");
        error_log("PRIMARY_LIGHT: $PRIMARY_LIGHT");
    }
    if (isset($organism['email'])) {
        $ORGANISM_EMAIL = $organism['email'];
    }
    if (isset($organism['telephone'])) {
        $ORGANISM_PHONE = $organism['telephone'];
    }
    if (isset($organism['adresse'])) {
        $ORGANISM_ADDRESS = $organism['adresse'];
    }
    if (isset($organism['emailDestination'])) {
        $RECIPIENT_EMAIL = $organism['emailDestination'];
    }
}

// Récupérer le type de formulaire et le type d'utilisateur
$formType = isset($data['formType']) ? $data['formType'] : '';
$userType = isset($data['userType']) ? $data['userType'] : 'particulier';

// Vérifier les champs requis de base
$requiredFields = ['formType', 'formation'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Le champ '$field' est requis."
        ]);
        exit();
    }
}

// Validation selon le type d'utilisateur
if ($userType === 'particulier') {
    // Champs requis pour particulier
    if (empty($data['lastname']) || empty($data['firstname']) || empty($data['email'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Le nom, le prénom et l\'email sont requis.'
        ]);
        exit();
    }
    
    // Valider l'email
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Adresse email invalide.'
        ]);
        exit();
    }
} else {
    // Champs requis pour entreprise
    if (empty($data['contact_lastname']) || empty($data['contact_firstname']) || empty($data['contact_email']) || empty($data['company_name'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Le nom du contact, le prénom, l\'email et le nom de l\'entreprise sont requis.'
        ]);
        exit();
    }
    
    // Valider l'email
    if (!filter_var($data['contact_email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Adresse email invalide.'
        ]);
        exit();
    }
}

// ============================================
// Logique Conditionnelle selon le Type de Formulaire et d'Utilisateur
// ============================================
$templateName = '';
$subject = '';
$templateVariables = [];

if ($formType === 'devis') {
    if ($userType === 'particulier') {
        // Devis Particulier
        $templateName = 'devis-particulier';
        $subject = 'Nouvelle Demande de Devis (Particulier) - ' . $data['formation'];
        
        // Formater les données
        $lastname = formatLastName($data['lastname'] ?? '');
        $firstname = formatFirstName($data['firstname'] ?? '');
        $city = formatCityName($data['city'] ?? '');
        
        // Construire le nom complet
        $fullName = trim($lastname . ' ' . $firstname);
        
        // Construire l'adresse complète
        $fullAddress = '';
        if (!empty($data['address'])) {
            $addressParts = [$data['address']];
            if (!empty($data['postal_code'])) $addressParts[] = $data['postal_code'];
            if (!empty($city)) $addressParts[] = $city;
            $fullAddress = implode(', ', $addressParts);
        }
        
        // Générer une référence unique basée sur le timestamp en millisecondes
        $timestamp = round(microtime(true) * 1000);
        $demandReference = 'DEV-' . date('Y') . '-' . $timestamp;
        
        $templateVariables = [
            'demande_reference' => $demandReference,
            'formation' => $data['formation'],
            'product_reference' => !empty($data['product_reference']) ? $data['product_reference'] : 'Non spécifiée',
            'lastname' => $lastname,
            'firstname' => $firstname,
            'fullname' => $fullName,
            'email' => $data['email'],
            'phone_mobile' => !empty($data['phone_mobile']) ? $data['phone_mobile'] : 'Non renseigné',
            'phone_fixed' => !empty($data['phone_fixed']) ? $data['phone_fixed'] : 'Non renseigné',
            'address' => !empty($fullAddress) ? $fullAddress : 'Non renseignée',
            'message' => !empty($data['message']) ? $data['message'] : 'Aucun message',
            'primary_color' => $PRIMARY_COLOR,
            'primary_dark' => $PRIMARY_DARK,
            'primary_light' => $PRIMARY_LIGHT
        ];
    } else {
        // Devis Entreprise
        $templateName = 'devis-entreprise';
        $subject = 'Nouvelle Demande de Devis (Entreprise) - ' . $data['formation'];
        
        // Formater les données
        $contactLastname = formatLastName($data['contact_lastname'] ?? '');
        $contactFirstname = formatFirstName($data['contact_firstname'] ?? '');
        $companyCity = formatCityName($data['company_city'] ?? '');
        
        // Construire le nom complet du contact
        $contactFullName = trim($contactLastname . ' ' . $contactFirstname);
        
        // Construire l'adresse complète
        $fullAddress = '';
        if (!empty($data['address_street'])) {
            $addressParts = [$data['address_street']];
            if (!empty($data['company_postal_code'])) $addressParts[] = $data['company_postal_code'];
            if (!empty($companyCity)) $addressParts[] = $companyCity;
            $fullAddress = implode(', ', $addressParts);
        }
        
        // Générer une référence unique basée sur le timestamp en millisecondes
        $timestamp = round(microtime(true) * 1000);
        $demandReference = 'DEV-ENT-' . date('Y') . '-' . $timestamp;
        
        $templateVariables = [
            'demande_reference' => $demandReference,
            'formation' => $data['formation'],
            'product_reference' => !empty($data['product_reference']) ? $data['product_reference'] : 'Non spécifiée',
            'company_name' => $data['company_name'],
            'contact_lastname' => $contactLastname,
            'contact_firstname' => $contactFirstname,
            'contact_fullname' => $contactFullName,
            'contact_function' => !empty($data['contact_function']) ? $data['contact_function'] : 'Non précisée',
            'contact_email' => $data['contact_email'],
            'contact_phone_mobile' => !empty($data['contact_phone_mobile']) ? $data['contact_phone_mobile'] : 'Non renseigné',
            'contact_phone_fixed' => !empty($data['contact_phone_fixed']) ? $data['contact_phone_fixed'] : 'Non renseigné',
            'siret' => !empty($data['siret']) ? $data['siret'] : 'Non renseigné',
            'address' => !empty($fullAddress) ? $fullAddress : 'Non renseignée',
            'participant_count' => !empty($data['participant_count']) ? $data['participant_count'] : 'Non précisé',
            'message' => !empty($data['message']) ? $data['message'] : 'Aucun message',
            'primary_color' => $PRIMARY_COLOR,
            'primary_dark' => $PRIMARY_DARK,
            'primary_light' => $PRIMARY_LIGHT
        ];
    }
    
} elseif ($formType === 'preinscription') {
    // Vérifier les champs spécifiques à la préinscription
    if (empty($data['session_date']) || empty($data['session_lieu'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Les informations de session sont requises pour une préinscription.'
        ]);
        exit();
    }
    
    if ($userType === 'particulier') {
        // Préinscription Particulier
        $templateName = 'preinscription-particulier';
        $subject = 'Nouvelle Demande de Préinscription (Particulier) - ' . $data['formation'];
        
        // Formater les données
        $lastname = formatLastName($data['lastname'] ?? '');
        $firstname = formatFirstName($data['firstname'] ?? '');
        $city = formatCityName($data['city'] ?? '');
        
        // Construire le nom complet
        $fullName = trim($lastname . ' ' . $firstname);
        
        // Construire l'adresse complète
        $fullAddress = '';
        if (!empty($data['address'])) {
            $addressParts = [$data['address']];
            if (!empty($data['postal_code'])) $addressParts[] = $data['postal_code'];
            if (!empty($city)) $addressParts[] = $city;
            $fullAddress = implode(', ', $addressParts);
        }
        
        // Générer une référence unique basée sur le timestamp en millisecondes
        $timestamp = round(microtime(true) * 1000);
        $demandReference = 'PRE-' . date('Y') . '-' . $timestamp;
        
        $templateVariables = [
            'demande_reference' => $demandReference,
            'formation' => $data['formation'],
            'product_reference' => !empty($data['product_reference']) ? $data['product_reference'] : 'Non spécifiée',
            'session_date' => $data['session_date'],
            'session_lieu' => $data['session_lieu'],
            'session_reference' => !empty($data['session_reference']) ? $data['session_reference'] : 'Non spécifiée',
            'lastname' => $lastname,
            'firstname' => $firstname,
            'fullname' => $fullName,
            'email' => $data['email'],
            'phone_mobile' => !empty($data['phone_mobile']) ? $data['phone_mobile'] : 'Non renseigné',
            'phone_fixed' => !empty($data['phone_fixed']) ? $data['phone_fixed'] : 'Non renseigné',
            'address' => !empty($fullAddress) ? $fullAddress : 'Non renseignée',
            'message' => !empty($data['message']) ? $data['message'] : 'Aucun message',
            'primary_color' => $PRIMARY_COLOR,
            'primary_dark' => $PRIMARY_DARK,
            'primary_light' => $PRIMARY_LIGHT
        ];
    } else {
        // Préinscription Entreprise
        $templateName = 'preinscription-entreprise';
        $subject = 'Nouvelle Demande de Préinscription (Entreprise) - ' . $data['formation'];
        
        // Formater les données
        $contactLastname = formatLastName($data['contact_lastname'] ?? '');
        $contactFirstname = formatFirstName($data['contact_firstname'] ?? '');
        $companyCity = formatCityName($data['company_city'] ?? '');
        
        // Construire le nom complet du contact
        $contactFullName = trim($contactLastname . ' ' . $contactFirstname);
        
        // Construire l'adresse complète
        $fullAddress = '';
        if (!empty($data['address_street'])) {
            $addressParts = [$data['address_street']];
            if (!empty($data['company_postal_code'])) $addressParts[] = $data['company_postal_code'];
            if (!empty($companyCity)) $addressParts[] = $companyCity;
            $fullAddress = implode(', ', $addressParts);
        }
        
        // Générer une référence unique basée sur le timestamp en millisecondes
        $timestamp = round(microtime(true) * 1000);
        $demandReference = 'PRE-ENT-' . date('Y') . '-' . $timestamp;
        
        // Gérer le nombre de participants et la liste
        $participantInfo = '';
        if (!empty($data['participant_list_count'])) {
            $participantInfo = 'Nombre de participants : ' . $data['participant_list_count'];
            if (!empty($data['participant_list'])) {
                $participantInfo .= "\n\nListe des participants :\n" . $data['participant_list'];
            }
        } elseif (!empty($data['participant_list'])) {
            $participantInfo = $data['participant_list'];
        } else {
            $participantInfo = 'Non précisé';
        }
        
        $templateVariables = [
            'demande_reference' => $demandReference,
            'formation' => $data['formation'],
            'product_reference' => !empty($data['product_reference']) ? $data['product_reference'] : 'Non spécifiée',
            'session_date' => $data['session_date'],
            'session_lieu' => $data['session_lieu'],
            'session_reference' => !empty($data['session_reference']) ? $data['session_reference'] : 'Non spécifiée',
            'company_name' => $data['company_name'],
            'contact_lastname' => $contactLastname,
            'contact_firstname' => $contactFirstname,
            'contact_fullname' => $contactFullName,
            'contact_function' => !empty($data['contact_function']) ? $data['contact_function'] : 'Non précisée',
            'contact_email' => $data['contact_email'],
            'contact_phone_mobile' => !empty($data['contact_phone_mobile']) ? $data['contact_phone_mobile'] : 'Non renseigné',
            'contact_phone_fixed' => !empty($data['contact_phone_fixed']) ? $data['contact_phone_fixed'] : 'Non renseigné',
            'siret' => !empty($data['siret']) ? $data['siret'] : 'Non renseigné',
            'address' => !empty($fullAddress) ? $fullAddress : 'Non renseignée',
            'participant_list' => $participantInfo,
            'message' => !empty($data['message']) ? $data['message'] : 'Aucun message',
            'primary_color' => $PRIMARY_COLOR,
            'primary_dark' => $PRIMARY_DARK,
            'primary_light' => $PRIMARY_LIGHT
        ];
    }
    
} else {
    // Type de formulaire non reconnu
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Type de formulaire non reconnu.'
    ]);
    exit();
}

// ============================================
// Envoi via Mailgun avec Template
// ============================================
$mailgunUrl = "https://api.mailgun.net/v3/$MAILGUN_DOMAIN/messages";

// Préparer les données pour Mailgun
$postData = [
    'from' => 'Formulaire Contact <noreply@' . $MAILGUN_DOMAIN . '>',
    'to' => $RECIPIENT_EMAIL,
    'subject' => $subject,
    'template' => $templateName,
    'h:X-Mailgun-Variables' => json_encode($templateVariables)
];

// Initialiser cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $mailgunUrl);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
curl_setopt($ch, CURLOPT_USERPWD, 'api:' . $MAILGUN_API_KEY);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

// Exécuter la requête
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
// curl_close($ch); // Déprécié en PHP 8.5, la ressource est automatiquement fermée

// ============================================
// Gestion de la Réponse
// ============================================
if ($httpCode === 200) {
    // ============================================
    // Envoi de l'email de confirmation au client
    // ============================================
    
    // Déterminer l'email du client
    $clientEmail = $userType === 'particulier' ? $data['email'] : $data['contact_email'];
    
    // Déterminer le type de demande pour l'affichage (simplifié, sans mention 'entreprise')
    $typeDemande = '';
    if ($formType === 'devis') {
        $typeDemande = 'demande de devis';
    } else {
        $typeDemande = 'préinscription';
    }
    
    // Générer une référence unique basée sur le timestamp en millisecondes
    $timestamp = round(microtime(true) * 1000); // Timestamp en millisecondes
    $reference = strtoupper($formType === 'devis' ? 'DEV' : 'PRE') . 
                 ($userType === 'entreprise' ? '-ENT' : '') . 
                 '-' . date('Y') . '-' . 
                 $timestamp;
    
    // Préparer les variables pour l'email de confirmation
    $confirmationVariables = [
        'typeDemande' => $typeDemande,
        'reference' => $reference,
        'logoUrl' => $ORGANISM_LOGO,
        'nomOrganisme' => $ORGANISM_NAME,
        'emailOrganisme' => $ORGANISM_EMAIL,
        'telephoneOrganisme' => $ORGANISM_PHONE,
        'adresseOrganisme' => $ORGANISM_ADDRESS,
        'primary_color' => $PRIMARY_COLOR,
        'primary_dark' => $PRIMARY_DARK,
        'primary_light' => $PRIMARY_LIGHT
    ];
    
    // Log des variables envoyées à Mailgun
    error_log("Variables Mailgun: " . json_encode($confirmationVariables));
    
    // Ajouter les données selon le type
    if ($userType === 'particulier') {
        $confirmationVariables['prenom'] = formatFirstName($data['firstname'] ?? '');
        $confirmationVariables['nom'] = formatLastName($data['lastname'] ?? '');
        $confirmationVariables['email'] = $data['email'];
        $confirmationVariables['telephone'] = $data['phone_mobile'] ?? $data['phone_fixed'] ?? '';
        $confirmationVariables['isEntreprise'] = false;
    } else {
        $confirmationVariables['prenom'] = formatFirstName($data['contact_firstname'] ?? '');
        $confirmationVariables['nom'] = formatLastName($data['contact_lastname'] ?? '');
        $confirmationVariables['email'] = $data['contact_email'];
        $confirmationVariables['telephone'] = $data['contact_phone_mobile'] ?? $data['contact_phone_fixed'] ?? '';
        $confirmationVariables['isEntreprise'] = true;
        $confirmationVariables['nomEntreprise'] = $data['company_name'] ?? '';
        $confirmationVariables['siret'] = $data['siret'] ?? '';
        $confirmationVariables['nombreParticipants'] = $data['participant_count'] ?? $data['participant_list_count'] ?? '';
    }
    
    // Ajouter les données spécifiques aux préinscriptions
    if ($formType === 'preinscription') {
        $confirmationVariables['isPreinscription'] = true;
        $confirmationVariables['formationTitre'] = $data['formation'];
        $confirmationVariables['sessionDate'] = $data['session_date'];
        $confirmationVariables['sessionLieu'] = $data['session_lieu'];
    } else {
        $confirmationVariables['isPreinscription'] = false;
    }
    
    // Ajouter le message si présent
    $message = $userType === 'particulier' ? 
               ($data['message'] ?? '') : 
               ($data['company_message'] ?? '');
    if (!empty($message)) {
        $confirmationVariables['message'] = $message;
    }
    
    // Préparer les données pour l'email de confirmation
    $confirmationPostData = [
        'from' => $ORGANISM_NAME . ' <noreply@' . $MAILGUN_DOMAIN . '>',
        'to' => $clientEmail,
        'subject' => 'Confirmation de votre ' . $typeDemande . ' - ' . $ORGANISM_NAME,
        'template' => 'confirmation-demande',
        'h:X-Mailgun-Variables' => json_encode($confirmationVariables)
    ];
    
    // Envoyer l'email de confirmation au client
    $chConfirmation = curl_init();
    curl_setopt($chConfirmation, CURLOPT_URL, $mailgunUrl);
    curl_setopt($chConfirmation, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($chConfirmation, CURLOPT_USERPWD, 'api:' . $MAILGUN_API_KEY);
    curl_setopt($chConfirmation, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chConfirmation, CURLOPT_POST, true);
    curl_setopt($chConfirmation, CURLOPT_POSTFIELDS, $confirmationPostData);
    curl_setopt($chConfirmation, CURLOPT_SSL_VERIFYPEER, true);
    
    // Exécuter la requête (on ne bloque pas si ça échoue)
    $confirmationResponse = curl_exec($chConfirmation);
    $confirmationHttpCode = curl_getinfo($chConfirmation, CURLINFO_HTTP_CODE);
    
    // Succès de l'envoi principal
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Votre message a été envoyé avec succès. Nous vous contacterons bientôt.'
    ]);
} else {
    // Erreur
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.',
        'debug' => [
            'http_code' => $httpCode,
            'curl_error' => $curlError,
            'response' => $response
        ]
    ]);
}
?>
