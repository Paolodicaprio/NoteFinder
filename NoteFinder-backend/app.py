from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import os
from PIL import Image
import pytesseract
import mysql.connector
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from flasgger import Swagger, swag_from
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'secret_key'  # Clé secrète pour les sessions
bcrypt = Bcrypt(app)
# Configuration des cookies de session
app.config['SESSION_COOKIE_SECURE'] = False  # Les cookies ne sont envoyés que sur HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Autorise les cookies sur les requêtes cross-origin


# Configuration CORS pour autoriser les requêtes provenant de http://localhost:3000
CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    return response

# Configuration MySQL (XAMPP)
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'entite'

# Configuration de Swagger
app.config['SWAGGER'] = {
    'title': 'API Documentation',
    'uiversion': 3,
    'description': 'Documentation for the API endpoints',
    'version': '1.0.0',
}

swagger = Swagger(app)

# ----------------------------------------------------------------------------------------

# Connexion MySQL
mysql = mysql.connector.connect(
    host=app.config['MYSQL_HOST'],
    user=app.config['MYSQL_USER'],
    password=app.config['MYSQL_PASSWORD'],
    database=app.config['MYSQL_DB']
)

# Gestion des sessions avec Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'apilogin'

class User(UserMixin):
    def __init__(self, id, email, role):
        self.id = id
        self.email = email
        self.role = role

def fetch_data(query, params=None):
    cursor = mysql.cursor()
    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)
    data = cursor.fetchall()
    cursor.close()
    return data

# Chemin pour enregistrer les fichiers téléchargés
UPLOAD_FOLDER = 'uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'jpg', 'jpeg', 'png'}

# Fonction pour vérifier si le fichier est valide
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@login_manager.user_loader
def load_user(user_id):
    cursor = mysql.cursor(dictionary=True)
    cursor.execute("SELECT * FROM membre_administratif WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    if user:
        return User(user['id'], user['email'], user['role'])
    return None

# ----------------------------------------------------------------------------------------

# Fonction pour obtenir une connexion MySQL
def get_db_connection():
    try:
        conn = mysql
        return conn
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# ----------------------------------------------------------------------------------------
# API pour auth
# ----------------------------------------------------------------------------------------

@app.route('/api/login', methods=['POST'])
@swag_from({
    'tags': ['Authentification'],
    'summary': 'Connexion utilisateur',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string'},
                    'password': {'type': 'string'}
                },
                'required': ['email', 'password']
            }
        }
    ],
    'responses': {
        200: {'description': 'Connexion réussie'},
        400: {'description': 'Email et mot de passe requis'},
        401: {'description': 'Identifiants incorrects'}
    }
})
def apilogin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    print(f"Tentative de connexion avec l'email : {email}")  # Debugging
    
    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400
    
    with mysql.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM membre_administratif WHERE email = %s", (email,))
        user = cursor.fetchone()
    
    if user and bcrypt.check_password_hash(user['mot_de_passe'], password):
        login_user(User(user['id'], user['email'], user['role']))
        session['user_id'] = user['id']
        return jsonify({
            'message': 'Connexion réussie',
            'success': True,
            'user': {'id': user['id'], 'email': user['email'], 'role': user['role']}
        }), 200
    else:
        return jsonify({'message': 'Identifiants incorrects', 'success': False}), 401
        
    
@app.route('/api/logout', methods=['POST'])
@swag_from({
    'tags': ['Authentification'],
    'summary': 'Déconnexion utilisateur',
    'responses': {
        200: {'description': 'Déconnexion réussie'}
    }
})
def apilogout():
    logout_user()
    session.pop('user_id', None)
    # Retournez une réponse simple sans redirection
    response = jsonify({'message': 'Déconnexion réussie'})
    response.status_code = 200
    return response

@app.route('/api/register', methods=['POST'])
@swag_from({
    'tags': ['Authentification'],
    'summary': 'Inscription utilisateur',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'email': {'type': 'string'},
                    'password': {'type': 'string'},
                    'role': {'type': 'string'}
                },
                'required': ['nom', 'prenom', 'email', 'password', 'role']
            }
        }
    ],
    'responses': {
        201: {'description': 'Compte créé avec succès'},
        400: {'description': 'Tous les champs sont requis ou email déjà existant'}
    }
})
def apicreate_account():
    data = request.get_json()
    nom = data.get('nom')
    prenom = data.get('prenom')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    
    if not all([nom, prenom, email, password, role]):
        return jsonify({'message': 'Tous les champs sont requis'}), 400
    
    with mysql.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM membre_administratif WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if user:
            return jsonify({'message': 'Un compte avec cet email existe déjà'}), 400
        
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        cursor.execute("INSERT INTO membre_administratif (nom, prenom, email, mot_de_passe, role) VALUES (%s, %s, %s, %s, %s)",
                       (nom, prenom, email, hashed_password, role))
        mysql.commit()
    
    return jsonify({'message': 'Compte créé avec succès'}), 201

@app.route('/api/user/profil', methods=['GET'])
@swag_from({
    'tags': ['Authentification'],
    'summary': 'Obtenir le profil de l’étudiant connecté',
    'responses': {
        200: {'description': 'Détails de l’étudiant'},
        401: {'description': 'Utilisateur non connecté'}
    }
})
@login_required
def get_user_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Utilisateur non connecté'}), 401

    cursor = mysql.cursor(dictionary=True)
    cursor.execute("SELECT id, nom, prenom, email, role FROM membre_administratif WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()

    if user:
        return jsonify({'user': user}), 200
    return jsonify({'error': 'Utilisateur non trouvé'}), 404


@app.route('/api/membres_administratifs', methods=['GET'])
@swag_from({
    'tags': ['Membre Administratif'],
    'summary': 'Get all administrative members',
    'responses': {
        200: {
            'description': 'List of all administrative members',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'nom': {'type': 'string'},
                        'prenom': {'type': 'string'},
                        'email': {'type': 'string'},
                        'role': {'type': 'string', 'enum': ['Admin', 'Secrétaire', 'Enseignant']}
                    }
                }
            }
        },
        500: {
            'description': 'Server error'
        }
    }
})
@login_required
def get_all_membres_administratifs():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, nom, prenom, email, role FROM membre_administratif")
        membres = cursor.fetchall()
        cursor.close()
        return jsonify(membres), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/membres_administratifs/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Membre Administratif'],
    'summary': 'Get an administrative member by ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the administrative member'
        }
    ],
    'responses': {
        200: {
            'description': 'Administrative member details',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'email': {'type': 'string'},
                    'role': {'type': 'string', 'enum': ['Admin', 'Secrétaire', 'Enseignant']}
                }
            }
        },
        404: {
            'description': 'Administrative member not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
@login_required
def get_membre_administratif(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, nom, prenom, email, role FROM membre_administratif WHERE id = %s", (id,))
        membre = cursor.fetchone()
        cursor.close()
        
        if membre:
            return jsonify(membre), 200
        else:
            return jsonify({'message': 'Membre administratif not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/membres_administratifs', methods=['POST'])
@swag_from({
    'tags': ['Membre Administratif'],
    'summary': 'Create a new administrative member',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'email': {'type': 'string'},
                    'mot_de_passe': {'type': 'string'},
                    'role': {'type': 'string', 'enum': ['Admin', 'Secrétaire', 'Enseignant']}
                },
                'required': ['nom', 'prenom', 'email', 'mot_de_passe', 'role']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Administrative member created successfully'
        },
        400: {
            'description': 'Invalid request data'
        },
        500: {
            'description': 'Server error'
        }
    }
})
@login_required
def create_membre_administratif():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['nom', 'prenom', 'email', 'mot_de_passe', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Validate role
        valid_roles = ['Admin', 'Secrétaire', 'Enseignant']
        if data['role'] not in valid_roles:
            return jsonify({'message': 'Invalid role'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT id FROM membre_administratif WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Email already exists'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(data['mot_de_passe'])
        
        sql = """INSERT INTO membre_administratif 
                 (nom, prenom, email, mot_de_passe, role) 
                 VALUES (%s, %s, %s, %s, %s)"""
        values = (
            data['nom'], 
            data['prenom'], 
            data['email'], 
            hashed_password, 
            data['role']
        )
        
        cursor.execute(sql, values)
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Membre administratif created successfully',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/membres_administratifs/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Membre Administratif'],
    'summary': 'Update an administrative member',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the administrative member'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'email': {'type': 'string'},
                    'mot_de_passe': {'type': 'string'},
                    'role': {'type': 'string', 'enum': ['Admin', 'Secrétaire', 'Enseignant']}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Administrative member updated successfully'
        },
        404: {
            'description': 'Administrative member not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
@login_required
def update_membre_administratif(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if membre exists
        cursor.execute("SELECT * FROM membre_administratif WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Membre administratif not found'}), 404
        
        # Check if email exists for other members
        if 'email' in data:
            cursor.execute("SELECT id FROM membre_administratif WHERE email = %s AND id != %s", (data['email'], id))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({'message': 'Another member with this email already exists'}), 400
        
        # Validate role if provided
        if 'role' in data:
            valid_roles = ['Admin', 'Secrétaire', 'Enseignant']
            if data['role'] not in valid_roles:
                cursor.close()
                conn.close()
                return jsonify({'message': 'Invalid role'}), 400
        
        # Build update query dynamically
        update_fields = []
        values = []
        
        for field in ['nom', 'prenom', 'email', 'role']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        # Handle password separately with hashing
        if 'mot_de_passe' in data:
            update_fields.append("mot_de_passe = %s")
            values.append(generate_password_hash(data['mot_de_passe']))
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'No fields to update'}), 400
        
        values.append(id)  # Add id for WHERE clause
        
        sql = f"UPDATE membre_administratif SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Membre administratif updated successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/membres_administratifs/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Membre Administratif'],
    'summary': 'Delete an administrative member',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the administrative member to delete'
        }
    ],
    'responses': {
        200: {
            'description': 'Administrative member deleted successfully'
        },
        404: {
            'description': 'Administrative member not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
@login_required
def supprimer_membre_administratif(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if membre exists
        cursor.execute("SELECT id FROM membre_administratif WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Membre administratif not found'}), 404
        
        cursor.execute("DELETE FROM membre_administratif WHERE id = %s", (id,))
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Membre administratif deleted successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500@app.route('/api/membres_administratifs', methods=['GET'])


# ----------------------------------------------------------------------------------------
# API pour la table 'filiere'
# ----------------------------------------------------------------------------------------

@app.route('/api/filieres', methods=['GET'])
@swag_from({
    'tags': ['Filiere'],
    'summary': 'Get all filieres',
    'responses': {
        200: {
            'description': 'List of all filieres',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'code': {'type': 'string'},
                        'nom': {'type': 'string'},
                        'mention': {'type': 'string'},
                        'domaine': {'type': 'string'}
                    }
                }
            }
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_all_filieres():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM filiere")
        filieres = cursor.fetchall()
        cursor.close()
        return jsonify(filieres), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/filieres/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Filiere'],
    'summary': 'Get a filiere by ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the filiere'
        }
    ],
    'responses': {
        200: {
            'description': 'Filiere details',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'code': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'mention': {'type': 'string'},
                    'domaine': {'type': 'string'}
                }
            }
        },
        404: {
            'description': 'Filiere not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_filiere(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM filiere WHERE id = %s", (id,))
        filiere = cursor.fetchone()
        cursor.close()
        
        if filiere:
            return jsonify(filiere), 200
        else:
            return jsonify({'message': 'Filiere not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/filieres', methods=['POST'])
@swag_from({
    'tags': ['Filiere'],
    'summary': 'Create a new filiere',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'code': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'mention': {'type': 'string'},
                    'domaine': {'type': 'string'}
                },
                'required': ['code', 'domaine']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Filiere created successfully'
        },
        400: {
            'description': 'Invalid request data'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def create_filiere():
    try:
        data = request.get_json()
        if not data or not 'code' in data or not 'domaine' in data:
            return jsonify({'message': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if code already exists
        cursor.execute("SELECT id FROM filiere WHERE code = %s", (data['code'],))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Filiere with this code already exists'}), 400
            
        sql = """INSERT INTO filiere (code, nom, mention, domaine) 
                 VALUES (%s, %s, %s, %s)"""
        values = (
            data['code'], 
            data.get('nom'), 
            data.get('mention'), 
            data['domaine']
        )
        
        cursor.execute(sql, values)
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Filiere created successfully',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/filieres/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Filiere'],
    'summary': 'Update a filiere',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the filiere'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'code': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'mention': {'type': 'string'},
                    'domaine': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Filiere updated successfully'
        },
        404: {
            'description': 'Filiere not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def update_filiere(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if filiere exists
        cursor.execute("SELECT * FROM filiere WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Filiere not found'}), 404
        
        # Check if code exists for other filieres
        if 'code' in data:
            cursor.execute("SELECT id FROM filiere WHERE code = %s AND id != %s", (data['code'], id))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({'message': 'Another filiere with this code already exists'}), 400
        
        # Build update query dynamically based on provided fields
        update_fields = []
        values = []
        
        for field in ['code', 'nom', 'mention', 'domaine']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'No fields to update'}), 400
        
        values.append(id)  # Add id for WHERE clause
        
        sql = f"UPDATE filiere SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Filiere updated successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/filieres/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Filiere'],
    'summary': 'Delete a filiere',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the filiere to delete'
        }
    ],
    'responses': {
        200: {
            'description': 'Filiere deleted successfully'
        },
        404: {
            'description': 'Filiere not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def supprimer_filiere(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if filiere exists
        cursor.execute("SELECT id FROM filiere WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Filiere not found'}), 404
        
        # Check for related records in annee_etude
        cursor.execute("SELECT id FROM annee_etude WHERE filiere_id = %s", (id,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Cannot delete filiere with related annee_etude records'}), 400
        
        cursor.execute("DELETE FROM filiere WHERE id = %s", (id,))
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Filiere deleted successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------------------
# API pour la table 'grade'
# ----------------------------------------------------------------------------------------

@app.route('/api/grades', methods=['GET'])
@swag_from({
    'tags': ['Grade'],
    'summary': 'Get all grades',
    'responses': {
        200: {
            'description': 'List of all grades',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'nom': {'type': 'string'}
                    }
                }
            }
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_all_grades():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM grade")
        grades = cursor.fetchall()
        cursor.close()
        return jsonify(grades), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/grades/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Grade'],
    'summary': 'Get a grade by ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the grade'
        }
    ],
    'responses': {
        200: {
            'description': 'Grade details',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'nom': {'type': 'string'}
                }
            }
        },
        404: {
            'description': 'Grade not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_grade(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM grade WHERE id = %s", (id,))
        grade = cursor.fetchone()
        cursor.close()
        
        if grade:
            return jsonify(grade), 200
        else:
            return jsonify({'message': 'Grade not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/grades', methods=['POST'])
@swag_from({
    'tags': ['Grade'],
    'summary': 'Create a new grade',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'}
                },
                'required': ['nom']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Grade created successfully'
        },
        400: {
            'description': 'Invalid request data'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def create_grade():
    try:
        data = request.get_json()
        if not data or not 'nom' in data:
            return jsonify({'message': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if nom already exists
        cursor.execute("SELECT id FROM grade WHERE nom = %s", (data['nom'],))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Grade with this name already exists'}), 400
            
        sql = "INSERT INTO grade (nom) VALUES (%s)"
        cursor.execute(sql, (data['nom'],))
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Grade created successfully',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/grades/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Grade'],
    'summary': 'Update a grade',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the grade'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'}
                },
                'required': ['nom']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Grade updated successfully'
        },
        404: {
            'description': 'Grade not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def update_grade(id):
    try:
        data = request.get_json()
        if not data or not 'nom' in data:
            return jsonify({'message': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if grade exists
        cursor.execute("SELECT id FROM grade WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Grade not found'}), 404
        
        # Check if nom exists for other grades
        cursor.execute("SELECT id FROM grade WHERE nom = %s AND id != %s", (data['nom'], id))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Another grade with this name already exists'}), 400
        
        sql = "UPDATE grade SET nom = %s WHERE id = %s"
        cursor.execute(sql, (data['nom'], id))
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Grade updated successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/grades/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Grade'],
    'summary': 'Delete a grade',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the grade to delete'
        }
    ],
    'responses': {
        200: {
            'description': 'Grade deleted successfully'
        },
        404: {
            'description': 'Grade not found'
        },
        400: {
            'description': 'Cannot delete grade with related records'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def supprimer_grade(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if grade exists
        cursor.execute("SELECT id FROM grade WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Grade not found'}), 404
        
        # Check for related records in annee_etude
        cursor.execute("SELECT id FROM annee_etude WHERE grade_id = %s", (id,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Cannot delete grade with related annee_etude records'}), 400
        
        cursor.execute("DELETE FROM grade WHERE id = %s", (id,))
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Grade deleted successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------------------
# API pour la table 'annee_academique'
# ----------------------------------------------------------------------------------------

@app.route('/api/annees-academiques', methods=['GET'])
@swag_from({
    'tags': ['Annee Academique'],
    'summary': 'Get all academic years',
    'responses': {
        200: {
            'description': 'List of all academic years',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'annee': {'type': 'string'}
                    }
                }
            }
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_all_annees_academiques():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM annee_academique")
        annees = cursor.fetchall()
        cursor.close()
        return jsonify(annees), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-academiques/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Annee Academique'],
    'summary': 'Get an academic year by ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the academic year'
        }
    ],
    'responses': {
        200: {
            'description': 'Academic year details',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'annee': {'type': 'string'}
                }
            }
        },
        404: {
            'description': 'Academic year not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_annee_academique(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM annee_academique WHERE id = %s", (id,))
        annee = cursor.fetchone()
        cursor.close()
        
        if annee:
            return jsonify(annee), 200
        else:
            return jsonify({'message': 'Academic year not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-academiques/latest', methods=['GET'])
@swag_from({
    'tags': ['Annee Academique'],
    'summary': 'Get the latest academic year',
    'responses': {
        200: {
            'description': 'Latest academic year details',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'annee': {'type': 'string'}
                }
            }
        },
        404: {
            'description': 'No academic years found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_latest_annee_academique():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM annee_academique ORDER BY annee DESC LIMIT 1")
        annee = cursor.fetchone()
        cursor.close()
        
        if annee:
            return jsonify(annee), 200
        else:
            return jsonify({'message': 'No academic years found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-academiques', methods=['POST'])
@swag_from({
    'tags': ['Annee Academique'],
    'summary': 'Create a new academic year',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'annee': {'type': 'string'}
                },
                'required': ['annee']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Academic year created successfully'
        },
        400: {
            'description': 'Invalid request data'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def create_annee_academique():
    try:
        data = request.get_json()
        if not data or not 'annee' in data:
            return jsonify({'message': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if annee already exists
        cursor.execute("SELECT id FROM annee_academique WHERE annee = %s", (data['annee'],))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Academic year already exists'}), 400
            
        sql = "INSERT INTO annee_academique (annee) VALUES (%s)"
        cursor.execute(sql, (data['annee'],))
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Academic year created successfully',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-academiques/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Annee Academique'],
    'summary': 'Update an academic year',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the academic year'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'annee': {'type': 'string'}
                },
                'required': ['annee']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Academic year updated successfully'
        },
        404: {
            'description': 'Academic year not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def update_annee_academique(id):
    try:
        data = request.get_json()
        if not data or not 'annee' in data:
            return jsonify({'message': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if academic year exists
        cursor.execute("SELECT id FROM annee_academique WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Academic year not found'}), 404
        
        # Check if annee exists for other academic years
        cursor.execute("SELECT id FROM annee_academique WHERE annee = %s AND id != %s", (data['annee'], id))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Another academic year with this value already exists'}), 400
        
        sql = "UPDATE annee_academique SET annee = %s WHERE id = %s"
        cursor.execute(sql, (data['annee'], id))
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Academic year updated successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-academiques/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Annee Academique'],
    'summary': 'Delete an academic year',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the academic year to delete'
        }
    ],
    'responses': {
        200: {
            'description': 'Academic year deleted successfully'
        },
        404: {
            'description': 'Academic year not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def supprimer_annee_academique(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if academic year exists
        cursor.execute("SELECT id FROM annee_academique WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Academic year not found'}), 404
        
        cursor.execute("DELETE FROM annee_academique WHERE id = %s", (id,))
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Academic year deleted successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------------------
# API pour la table 'annee_etude'
# ----------------------------------------------------------------------------------------

@app.route('/api/annees-etude', methods=['GET'])
@swag_from({
    'tags': ['Annee Etude'],
    'summary': 'Get all study years',
    'responses': {
        200: {
            'description': 'List of all study years',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'code': {'type': 'string'},
                        'niveau': {'type': 'integer'},
                        'filiere_id': {'type': 'integer'},
                        'grade_id': {'type': 'integer'}
                    }
                }
            }
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_all_annees_etude():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM annee_etude LEFT JOIN filiere ON annee_etude.filiere_id = filiere.id LEFT JOIN grade ON annee_etude.grade_id = grade.id")
        annees = cursor.fetchall()
        cursor.close()
        return jsonify(annees), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-etude/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Annee Etude'],
    'summary': 'Get a study year by ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the study year'
        }
    ],
    'responses': {
        200: {
            'description': 'Study year details',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'code': {'type': 'string'},
                    'niveau': {'type': 'integer'},
                    'filiere_id': {'type': 'integer'},
                    'grade_id': {'type': 'integer'}
                }
            }
        },
        404: {
            'description': 'Study year not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_annee_etude(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM annee_etude LEFT JOIN filiere ON annee_etude.filiere_id = filiere.id LEFT JOIN grade ON annee_etude.grade_id = grade.id WHERE id = %s", (id,))
        annee = cursor.fetchone()
        cursor.close()
        
        if annee:
            return jsonify(annee), 200
        else:
            return jsonify({'message': 'Study year not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-etude/filiere/<int:filiere_id>', methods=['GET'])
@swag_from({
    'tags': ['Annee Etude'],
    'summary': 'Get study years by filiere ID',
    'parameters': [
        {
            'name': 'filiere_id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the filiere'
        }
    ],
    'responses': {
        200: {
            'description': 'List of study years for the filiere',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'code': {'type': 'string'},
                        'niveau': {'type': 'integer'},
                        'filiere_id': {'type': 'integer'},
                        'grade_id': {'type': 'integer'}
                    }
                }
            }
        },
        404: {
            'description': 'Filiere not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_annees_etude_by_filiere(filiere_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if filiere exists
        cursor.execute("SELECT id FROM filiere WHERE id = %s", (filiere_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Filiere not found'}), 404
            
        cursor.execute("SELECT * FROM annee_etude WHERE filiere_id = %s", (filiere_id,))
        annees = cursor.fetchall()
        cursor.close()
        
        return jsonify(annees), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-etude', methods=['POST'])
@swag_from({
    'tags': ['Annee Etude'],
    'summary': 'Create a new study year',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'code': {'type': 'string'},
                    'niveau': {'type': 'integer'},
                    'filiere_id': {'type': 'integer'},
                    'grade_id': {'type': 'integer'}
                },
                'required': ['code', 'niveau']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Study year created successfully'
        },
        400: {
            'description': 'Invalid request data'
        },
        404: {
            'description': 'Referenced filiere or grade not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def create_annee_etude():
    try:
        data = request.get_json()
        if not data or not 'code' in data or not 'niveau' in data:
            return jsonify({'message': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if code already exists
        cursor.execute("SELECT id FROM annee_etude WHERE code = %s", (data['code'],))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Study year with this code already exists'}), 400
        
        # Check if filiere exists if filiere_id is provided
        if 'filiere_id' in data and data['filiere_id'] is not None:
            cursor.execute("SELECT id FROM filiere WHERE id = %s", (data['filiere_id'],))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({'message': 'Referenced filiere not found'}), 404
        
        # Check if grade exists if grade_id is provided
        if 'grade_id' in data and data['grade_id'] is not None:
            cursor.execute("SELECT id FROM grade WHERE id = %s", (data['grade_id'],))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({'message': 'Referenced grade not found'}), 404
            
        sql = """INSERT INTO annee_etude (code, niveau, filiere_id, grade_id) 
                 VALUES (%s, %s, %s, %s)"""
        values = (
            data['code'], 
            data['niveau'], 
            data.get('filiere_id'), 
            data.get('grade_id')
        )
        
        cursor.execute(sql, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Study year created successfully',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-etude/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Annee Etude'],
    'summary': 'Update a study year',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the study year'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'code': {'type': 'string'},
                    'niveau': {'type': 'integer'},
                    'filiere_id': {'type': 'integer'},
                    'grade_id': {'type': 'integer'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Study year updated successfully'
        },
        404: {
            'description': 'Study year or referenced entity not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def update_annee_etude(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if study year exists
        cursor.execute("SELECT * FROM annee_etude WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Study year not found'}), 404
        
        # Check if code exists for other study years
        if 'code' in data:
            cursor.execute("SELECT id FROM annee_etude WHERE code = %s AND id != %s", (data['code'], id))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({'message': 'Another study year with this code already exists'}), 400
        
        # Check if filiere exists if filiere_id is provided
        if 'filiere_id' in data and data['filiere_id'] is not None:
            cursor.execute("SELECT id FROM filiere WHERE id = %s", (data['filiere_id'],))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({'message': 'Referenced filiere not found'}), 404
        
        # Check if grade exists if grade_id is provided
        if 'grade_id' in data and data['grade_id'] is not None:
            cursor.execute("SELECT id FROM grade WHERE id = %s", (data['grade_id'],))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({'message': 'Referenced grade not found'}), 404
        
        # Build update query dynamically based on provided fields
        update_fields = []
        values = []
        
        for field in ['code', 'niveau', 'filiere_id', 'grade_id']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'No fields to update'}), 400
        
        values.append(id)  # Add id for WHERE clause
        
        sql = f"UPDATE annee_etude SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Study year updated successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/annees-etude/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Annee Etude'],
    'summary': 'Delete a study year',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID of the study year to delete'
        }
    ],
    'responses': {
        200: {
            'description': 'Study year deleted successfully'
        },
        404: {
            'description': 'Study year not found'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def supprimer_annee_etude(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if study year exists
        cursor.execute("SELECT id FROM annee_etude WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Study year not found'}), 404
        
        cursor.execute("DELETE FROM annee_etude WHERE id = %s", (id,))
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Study year deleted successfully',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# ----------------------------------------------------------------------------------------
# API pour la table 'ecue'
# ----------------------------------------------------------------------------------------

@app.route('/api/ecues', methods=['GET'])
@swag_from({
    'tags': ['Ecue'],
    'summary': 'Obtenir tous les ECUEs',
    'responses': {
        200: {
            'description': 'Liste de tous les ECUEs',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'code': {'type': 'string'},
                        'nom': {'type': 'string'},
                        'ue_id': {'type': 'integer'},
                        'enseignant_id': {'type': 'integer'}
                    }
                }
            }
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_all_ecues():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ecue LEFT JOIN ue ON ecue.ue_id = ue.id LEFT JOIN enseignant ON ecue.enseignant_id = enseignant.id")
        ecues = cursor.fetchall()
        cursor.close()
        return jsonify(ecues), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ecues/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Ecue'],
    'summary': 'Obtenir un ECUE par ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'ECUE'
        }
    ],
    'responses': {
        200: {
            'description': 'Détails de l\'ECUE',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'code': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'ue_id': {'type': 'integer'},
                    'enseignant_id': {'type': 'integer'}
                }
            }
        },
        404: {
            'description': 'ECUE non trouvé'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_ecue(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ecue LEFT JOIN ue ON ecue.ue_id = ue.id LEFT JOIN enseignant ON ecue.enseignant_id = enseignant.id WHERE id = %s", (id,))
        ecue = cursor.fetchone()
        cursor.close()
        
        if ecue:
            return jsonify(ecue), 200
        else:
            return jsonify({'message': 'ECUE non trouvé'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ecues', methods=['POST'])
@swag_from({
    'tags': ['Ecue'],
    'summary': 'Créer un nouvel ECUE',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'code': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'ue_id': {'type': 'integer'},
                    'enseignant_id': {'type': 'integer'}
                },
                'required': ['code', 'nom']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'ECUE créé avec succès'
        },
        400: {
            'description': 'Données de demande invalides'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def create_ecue():
    try:
        data = request.get_json()
        if not data or not 'code' in data or not 'nom' in data:
            return jsonify({'message': 'Champs obligatoires manquants'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """INSERT INTO ecue (code, nom, ue_id, enseignant_id) 
                 VALUES (%s, %s, %s, %s)"""
        values = (
            data['code'], 
            data['nom'], 
            data.get('ue_id'), 
            data.get('enseignant_id')
        )
        
        cursor.execute(sql, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'ECUE créé avec succès',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ecues/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Ecue'],
    'summary': 'Mettre à jour un ECUE',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'ECUE'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'code': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'ue_id': {'type': 'integer'},
                    'enseignant_id': {'type': 'integer'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'ECUE mis à jour avec succès'
        },
        404: {
            'description': 'ECUE ou entité référencée non trouvée'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def update_ecue(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si l'ECUE existe
        cursor.execute("SELECT * FROM ecue WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'ECUE non trouvé'}), 404
        
        # Construire la requête de mise à jour
        update_fields = []
        values = []
        
        for field in ['code', 'nom', 'ue_id', 'enseignant_id']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Aucun champ à mettre à jour'}), 400
        
        values.append(id)  # Ajouter l'id pour la clause WHERE
        
        sql = f"UPDATE ecue SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'ECUE mis à jour avec succès',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ecues/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Ecue'],
    'summary': 'Supprimer un ECUE',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'ECUE'
        }
    ],
    'responses': {
        200: {
            'description': 'ECUE supprimé avec succès'
        },
        404: {
            'description': 'ECUE non trouvé'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def suprrimer_ecue(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si l'ECUE existe
        cursor.execute("SELECT * FROM ecue WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'ECUE non trouvé'}), 404
        
        cursor.execute("DELETE FROM ecue WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        
        return jsonify({'message': 'ECUE supprimé avec succès'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------------------
# API pour la table 'etudiant'
# ----------------------------------------------------------------------------------------

@app.route('/api/etudiants', methods=['GET'])
@swag_from({
    'tags': ['Etudiant'],
    'summary': 'Obtenir tous les étudiants',
    'responses': {
        200: {
            'description': 'Liste de tous les étudiants',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'matricule': {'type': 'string'},
                        'nom': {'type': 'string'},
                        'prenom': {'type': 'string'},
                        'email': {'type': 'string'},
                        'date_naissance': {'type': 'string', 'format': 'date'},
                        'niveau': {'type': 'string'}
                    }
                }
            }
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_all_etudiants():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM etudiant")
        etudiants = cursor.fetchall()
        cursor.close()
        return jsonify(etudiants), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/etudiants/<string:matricule>', methods=['GET'])
@swag_from({
    'tags': ['Etudiant'],
    'summary': 'Obtenir un étudiant par Matricule',
    'parameters': [
        {
            'name': 'matricule',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Matricule de l\'étudiant'
        }
    ],
    'responses': {
        200: {
            'description': 'Détails de l\'étudiant',
            'schema': {
                'type': 'object',
                'properties': {
                    'matricule': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'email': {'type': 'string'},
                    'date_naissance': {'type': 'string', 'format': 'date'},
                    'telephone': {'type': 'string'},
                    'code': {'type': 'string'},
                    'sexe': {'type': 'string'},
                }
            }
        },
        404: {
            'description': 'Étudiant non trouvé'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_etudiant(matricule):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM etudiant WHERE matricule = %s", (matricule,))
        etudiant = cursor.fetchone()
        cursor.close()
        
        if etudiant:
            return jsonify(etudiant), 200
        else:
            return jsonify({'message': 'Étudiant non trouvé'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/etudiants', methods=['POST'])
@swag_from({
    'tags': ['Etudiant'],
    'summary': 'Créer un nouvel étudiant',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'matricule': {'type': 'string'},
                    'email': {'type': 'string'},
                    'date_naissance': {'type': 'string', 'format': 'date'},
                    'sexe': {'type': 'string'},
                    'telephone': {'type': 'string'},
                    'code': {'type': 'string'},
                },
                'required': ['nom', 'prenom', 'matricule', 'email', 'date_naissance', 'sexe', 'telephone', 'code']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Étudiant créé avec succès'
        },
        400: {
            'description': 'Données de demande invalides'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def create_etudiant():
    try:
        data = request.get_json()
        if not data or not all(field in data for field in ['nom', 'prenom', 'matricule', 'email', 'date_naissance', 'sexe', 'code', 'telephone']):
            return jsonify({'message': 'Champs obligatoires manquants'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """INSERT INTO etudiant (nom, prenom, matricule, email, date_naissance, sexe, code, telephone) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        values = (data['nom'], data['prenom'], data['matricule'], data['email'], data['date_naissance'], data['sexe'], data['code'], data['telephone'])
        
        cursor.execute(sql, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Étudiant créé avec succès',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/etudiants/<string:matricule>', methods=['PUT'])
@swag_from({
    'tags': ['Etudiant'],
    'summary': 'Mettre à jour un étudiant',
    'parameters': [
        {
            'name': 'matricule',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'Matricule de l\'étudiant'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'email': {'type': 'string'},
                    'date_naissance': {'type': 'string', 'format': 'date'},
                    'niveau': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Étudiant mis à jour avec succès'
        },
        404: {
            'description': 'Étudiant non trouvé'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def update_etudiant(matricule):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si l'étudiant existe
        cursor.execute("SELECT * FROM etudiant WHERE matricule = %s", (matricule,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Étudiant non trouvé'}), 404
        
        # Construire la requête de mise à jour
        update_fields = []
        values = []
        
        for field in ['nom', 'prenom', 'email', 'date_naissance', 'niveau']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Aucun champ à mettre à jour'}), 400
        
        values.append(id)  # Ajouter l'id pour la clause WHERE
        
        sql = f"UPDATE etudiant SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Étudiant mis à jour avec succès',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/etudiants/login', methods=['POST'])
@swag_from({
    'tags': ['Etudiant'],
    'summary': 'Connexion d\'un étudiant',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'matricule': {'type': 'string'},
                    'code': {'type': 'string'},
                },
                'required': ['matricule', 'code']
            }
        }
    ],
    'responses': {
        200: {'description': 'Connexion réussie'},
        401: {'description': 'Matricule ou code incorrect'},
        500: {'description': 'Erreur serveur'}
    }
})
def login_etudiant():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        data = request.get_json()
        if not data or not all(field in data for field in ['matricule', 'code']):
            return jsonify({'message': 'Champs obligatoires manquants'}), 400

        cursor.execute("SELECT * FROM etudiant WHERE matricule = %s AND code = %s", (data["matricule"], data["code"]))
        etudiant = cursor.fetchone()
        cursor.close()

        if etudiant:
            return jsonify({'message': 'Connexion réussie', 'etudiant': etudiant}), 200
        else:
            return jsonify({'error': 'Matricule ou code incorrect'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/etudiants/<int:matricule>', methods=['DELETE'])  # Changé à int
@swag_from({
    'tags': ['Etudiant'],
    'summary': 'Supprimer un étudiant',
    'parameters': [
        {
            'name': 'matricule',
            'in': 'path',
            'type': 'integer',  # Cohérent avec le type de route
            'required': True,
            'description': 'Matricule de l\'étudiant'
        }
    ],
    'responses': {
        200: {
            'description': 'Étudiant supprimé avec succès',
            'examples': {'message': 'Étudiant supprimé avec succès'}
        },
        404: {
            'description': 'Étudiant non trouvé',
            'examples': {'message': 'Étudiant non trouvé'}
        },
        400: {
            'description': 'Matricule invalide ou contrainte d\'intégrité',
            'examples': {'error': 'Cet étudiant a des notes associées'}
        },
        500: {
            'description': 'Erreur serveur',
            'examples': {'error': 'Erreur interne du serveur'}
        }
    }
})
def supprimer_etudiant(matricule):  # Correction du nom de fonction (supprimer au lieu de suprrimer)
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier existence
        cursor.execute("SELECT 1 FROM etudiant WHERE matricule = %s", (matricule,))
        if not cursor.fetchone():
            return jsonify({'message': 'Étudiant non trouvé'}), 404
        
        # Suppression
        cursor.execute("DELETE FROM etudiant WHERE matricule = %s", (matricule,))
        conn.commit()
        
        return jsonify({'message': 'Étudiant supprimé avec succès'}), 200

    except psycopg2.IntegrityError as e:
        conn.rollback()
        error_msg = str(e)
        if "foreign key constraint" in error_msg:
            return jsonify({
                'error': 'Impossible de supprimer - étudiant référencé dans d\'autres tables',
                'details': 'Supprimez d\'abord les notes/inscriptions associées'
            }), 400
        return jsonify({'error': 'Erreur de contrainte d\'intégrité'}), 400
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({
            'error': 'Erreur lors de la suppression',
            'details': str(e)
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ----------------------------------------------------------------------------------------
# API pour la table 'moyenne_ue'
# ----------------------------------------------------------------------------------------

@app.route('/api/moyenne_ue', methods=['GET'])
@swag_from({
    'tags': ['Moyenne_ue'],
    'summary': 'Obtenir toutes les moyennes d\'UE',
    'responses': {
        200: {
            'description': 'Liste de toutes les moyennes d\'UE',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'etudiant_matricule': {'type': 'string'},
                        'ue_id': {'type': 'integer'},
                        'annee_academique_id': {'type': 'integer'},
                        'moyenne': {'type': 'number', 'format': 'decimal'},
                        'verdict': {'type': 'string'}
                    }
                }
            }
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_all_moyenne_ue():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM moyenne_ue")
        moyenne_ues = cursor.fetchall()
        cursor.close()
        return jsonify(moyenne_ues), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/moyenne_ue/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Moyenne_ue'],
    'summary': 'Obtenir une moyenne d\'UE par ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de la moyenne d\'UE'
        }
    ],
    'responses': {
        200: {
            'description': 'Détails de la moyenne d\'UE',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'etudiant_matricule': {'type': 'string'},
                    'ue_id': {'type': 'integer'},
                    'annee_academique_id': {'type': 'integer'},
                    'moyenne': {'type': 'number', 'format': 'decimal'},
                    'verdict': {'type': 'string'}
                }
            }
        },
        404: {
            'description': 'Moyenne d\'UE non trouvée'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_moyenne_ue(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM moyenne_ue WHERE id = %s", (id,))
        moyenne_ue = cursor.fetchone()
        cursor.close()
        
        if moyenne_ue:
            return jsonify(moyenne_ue), 200
        else:
            return jsonify({'message': 'Moyenne d\'UE non trouvée'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/moyenne_ue', methods=['POST'])
@swag_from({
    'tags': ['Moyenne_ue'],
    'summary': 'Créer une nouvelle moyenne d\'UE',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'etudiant_matricule': {'type': 'string'},
                    'ue_id': {'type': 'integer'},
                    'annee_academique_id': {'type': 'integer'},
                    'moyenne': {'type': 'number', 'format': 'decimal'},
                    'verdict': {'type': 'string'}
                },
                'required': ['etudiant_matricule', 'ue_id', 'annee_academique_id', 'moyenne', 'verdict']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Moyenne d\'UE créée avec succès'
        },
        400: {
            'description': 'Données de demande invalides'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def create_moyenne_ue():
    try:
        data = request.get_json()
        if not data or not all(field in data for field in ['etudiant_matricule', 'ue_id', 'annee_academique_id', 'moyenne', 'verdict']):
            return jsonify({'message': 'Champs obligatoires manquants'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """INSERT INTO moyenne_ue (etudiant_matricule, ue_id, annee_academique_id, moyenne, verdict) 
                 VALUES (%s, %s, %s, %s, %s)"""
        values = (data['etudiant_matricule'], data['ue_id'], data['annee_academique_id'], data['moyenne'], data['verdict'])
        
        cursor.execute(sql, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Moyenne d\'UE créée avec succès',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/moyenne_ue/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Moyenne_ue'],
    'summary': 'Mettre à jour une moyenne d\'UE',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de la moyenne d\'UE'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'etudiant_matricule': {'type': 'string'},
                    'ue_id': {'type': 'integer'},
                    'annee_academique_id': {'type': 'integer'},
                    'moyenne': {'type': 'number', 'format': 'decimal'},
                    'verdict': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Moyenne d\'UE mise à jour avec succès'
        },
        404: {
            'description': 'Moyenne d\'UE non trouvée'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def update_moyenne_ue(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si la moyenne d'UE existe
        cursor.execute("SELECT * FROM moyenne_ue WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Moyenne d\'UE non trouvée'}), 404
        
        # Construire la requête de mise à jour
        update_fields = []
        values = []
        
        for field in ['etudiant_matricule', 'ue_id', 'annee_academique_id', 'moyenne', 'verdict']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Aucun champ à mettre à jour'}), 400
        
        values.append(id)  # Ajouter l'id pour la clause WHERE
        
        sql = f"UPDATE moyenne_ue SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Moyenne d\'UE mise à jour avec succès',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/moyenne_ue/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Moyenne_ue'],
    'summary': 'Supprimer une moyenne d\'UE',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de la moyenne d\'UE'
        }
    ],
    'responses': {
        200: {
            'description': 'Moyenne d\'UE supprimée avec succès'
        },
        404: {
            'description': 'Moyenne d\'UE non trouvée'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def suprrimer_moyenne_ue(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si la moyenne d'UE existe
        cursor.execute("SELECT * FROM moyenne_ue WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Moyenne d\'UE non trouvée'}), 404
        
        cursor.execute("DELETE FROM moyenne_ue WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        
        return jsonify({'message': 'Moyenne d\'UE supprimée avec succès'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# ----------------------------------------------------------------------------------------
# API pour la table 'enseignant'
# ----------------------------------------------------------------------------------------

@app.route('/api/enseignant', methods=['GET'])
@swag_from({
    'tags': ['Enseignant'],
    'summary': 'Obtenir tous les enseignants',
    'responses': {
        200: {
            'description': 'Liste des enseignants',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'nom': {'type': 'string'},
                        'prenom': {'type': 'string'},
                        'email': {'type': 'string'},
                        'telephone': {'type': 'string'},
                        'specialite': {'type': 'string'}
                    }
                }
            }
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_all_enseignants():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM enseignant")
        enseignants = cursor.fetchall()
        cursor.close()
        return jsonify(enseignants), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enseignant/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Enseignant'],
    'summary': 'Obtenir un enseignant par ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'enseignant'
        }
    ],
    'responses': {
        200: {'description': 'Détails de l\'enseignant'},
        404: {'description': 'Enseignant non trouvé'},
        500: {'description': 'Erreur serveur'}
    }
})
def get_enseignant(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM enseignant WHERE id = %s", (id,))
        enseignant = cursor.fetchone()
        cursor.close()
        if enseignant:
            return jsonify(enseignant), 200
        else:
            return jsonify({'message': 'Enseignant non trouvé'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enseignant', methods=['POST'])
@swag_from({
    'tags': ['Enseignant'],
    'summary': 'Créer un nouvel enseignant',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'email': {'type': 'string'},
                    'telephone': {'type': 'string'},
                    'specialite': {'type': 'string'}
                },
                'required': ['nom', 'prenom', 'email', 'specialite']
            }
        }
    ],
    'responses': {
        201: {'description': 'Enseignant créé avec succès'},
        400: {'description': 'Données de requête invalides'},
        500: {'description': 'Erreur serveur'}
    }
})
def create_enseignant():
    try:
        data = request.get_json()
        if not data or not all(field in data for field in ['nom', 'prenom', 'email', 'specialite']):
            return jsonify({'message': 'Champs obligatoires manquants'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """INSERT INTO enseignant (nom, prenom, email, telephone, specialite) 
                 VALUES (%s, %s, %s, %s, %s)"""
        values = (data['nom'], data['prenom'], data['email'], data.get('telephone'), data['specialite'])
        
        cursor.execute(sql, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Enseignant créé avec succès',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enseignant/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Enseignant'],
    'summary': 'Mettre à jour un enseignant',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'enseignant'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'nom': {'type': 'string'},
                    'prenom': {'type': 'string'},
                    'email': {'type': 'string'},
                    'telephone': {'type': 'string'},
                    'specialite': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'Enseignant mis à jour avec succès'},
        404: {'description': 'Enseignant non trouvé'},
        500: {'description': 'Erreur serveur'}
    }
})
def update_enseignant(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM enseignant WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Enseignant non trouvé'}), 404
        
        update_fields = []
        values = []
        
        for field in ['nom', 'prenom', 'email', 'telephone', 'specialite']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Aucun champ à mettre à jour'}), 400
        
        values.append(id)
        
        sql = f"UPDATE enseignant SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Enseignant mis à jour avec succès',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enseignant/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Enseignant'],
    'summary': 'Supprimer un enseignant',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'enseignant'
        }
    ],
    'responses': {
        200: {'description': 'Enseignant supprimé avec succès'},
        404: {'description': 'Enseignant non trouvé'},
        500: {'description': 'Erreur serveur'}
    }
})
def supprimer_enseignant(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM enseignant WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        return jsonify({'message': 'Enseignant supprimé avec succès'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# ----------------------------------------------------------------------------------------
# API pour la table 'note'
# ----------------------------------------------------------------------------------------
@app.route('/api/notes', methods=['GET'])
@swag_from({
    'tags': ['Notes'],
    'summary': 'Get notes for specific parameters',
    'parameters': [
        {
            'name': 'ecue_id',
            'in': 'query',
            'type': 'integer',
            'required': True,
            'description': 'ID of the ECUE'
        },
        {
            'name': 'annee_etude_id',
            'in': 'query',
            'type': 'integer',
            'required': True,
            'description': 'ID of the study year'
        },
        {
            'name': 'annee_academique_id',
            'in': 'query',
            'type': 'integer',
            'required': True,
            'description': 'ID of the academic year'
        },
        {
            'name': 'semestre',
            'in': 'query',
            'type': 'integer',
            'required': True,
            'description': 'Semester number'
        }
    ],
    'responses': {
        200: {
            'description': 'List of notes for the specified parameters',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'matricule': {'type': 'string'},
                        'nom': {'type': 'string'},
                        'prenom': {'type': 'string'},
                        'note': {'type': 'number'}
                    }
                }
            }
        },
        400: {
            'description': 'Missing or invalid parameters'
        },
        500: {
            'description': 'Server error'
        }
    }
})
def get_notes():
    try:
        # Get query parameters
        ecue_id = request.args.get('ecue_id', type=int)
        annee_etude_id = request.args.get('annee_etude_id', type=int)
        annee_academique_id = request.args.get('annee_academique_id', type=int)
        semestre = request.args.get('semestre', type=int)

        # Validate parameters
        if not all([ecue_id, annee_etude_id, annee_academique_id, semestre]):
            return jsonify({'message': 'Missing required parameters'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Complex query to get notes with student details
        query = """
        SELECT 
            e.matricule, 
            e.nom, 
            e.prenom, 
            COALESCE(n.note, 0) as note
        FROM 
            etudiant e
        JOIN 
            parcours_etudiant pe ON e.matricule = pe.etudiant_matricule
        LEFT JOIN 
            note n ON n.parcours_etudiant_id = pe.id AND n.ecue_id = %s
        WHERE 
            pe.annee_etude_id = %s 
            AND pe.annee_academique_id = %s 
            AND pe.semestre = %s
        """

        cursor.execute(query, (ecue_id, annee_etude_id, annee_academique_id, semestre))
        notes = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(notes), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/note', methods=['GET'])
@swag_from({
    'tags': ['Note'],
    'summary': 'Obtenir toutes les notes',
    'responses': {
        200: {
            'description': 'Liste de toutes les notes',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'ecue_id': {'type': 'integer'},
                        'parcours_etudiant_id': {'type': 'integer'},
                        'note': {'type': 'number', 'format': 'decimal'}
                    }
                }
            }
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_all_notes():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM note LEFT JOIN parcours_etudiant ON note.parcours_etudiant_id = parcours_etudiant.id")
        notes = cursor.fetchall()
        cursor.close()
        return jsonify(notes), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/note/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Note'],
    'summary': 'Obtenir une note par ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de la note'
        }
    ],
    'responses': {
        200: {
            'description': 'Détails de la note',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'ecue_id': {'type': 'integer'},
                    'parcours_etudiant_id': {'type': 'integer'},
                    'note': {'type': 'number', 'format': 'decimal'}
                }
            }
        },
        404: {
            'description': 'Note non trouvée'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_note(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM note LEFT JOIN parcours_etudiant ON note.parcours_etudiant_id = parcours_etudiant.id WHERE id = %s", (id,))
        note = cursor.fetchone()
        cursor.close()
        
        if note:
            return jsonify(note), 200
        else:
            return jsonify({'message': 'Note non trouvée'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/note', methods=['POST'])
@swag_from({
    'tags': ['Note'],
    'summary': 'Créer une nouvelle note',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'ecue_id': {'type': 'integer'},
                    'parcours_etudiant_id': {'type': 'integer'},
                    'note': {'type': 'number', 'format': 'decimal'}
                },
                'required': ['ecue_id', 'parcours_etudiant_id', 'note']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Note créée avec succès'
        },
        400: {
            'description': 'Données de demande invalides'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def create_note():
    try:
        data = request.get_json()
        if not data or not all(field in data for field in ['ecue_id', 'parcours_etudiant_id', 'note']):
            return jsonify({'message': 'Champs obligatoires manquants'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """INSERT INTO note (ecue_id, parcours_etudiant_id, note) 
                 VALUES (%s, %s, %s)"""
        values = (data['ecue_id'], data['parcours_etudiant_id'], data['note'])
        
        cursor.execute(sql, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Note créée avec succès',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/note/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Note'],
    'summary': 'Mettre à jour une note',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de la note'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'ecue_id': {'type': 'integer'},
                    'parcours_etudiant_id': {'type': 'integer'},
                    'note': {'type': 'number', 'format': 'decimal'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Note mise à jour avec succès'
        },
        404: {
            'description': 'Note non trouvée'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def update_note(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si la note existe
        cursor.execute("SELECT * FROM note WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Note non trouvée'}), 404
        
        # Construire la requête de mise à jour
        update_fields = []
        values = []
        
        for field in ['ecue_id', 'parcours_etudiant_id', 'note']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Aucun champ à mettre à jour'}), 400
        
        values.append(id)  # Ajouter l'id pour la clause WHERE
        
        sql = f"UPDATE note SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Note mise à jour avec succès',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/note/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Note'],
    'summary': 'Supprimer une note',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de la note'
        }
    ],
    'responses': {
        200: {
            'description': 'Note supprimée avec succès'
        },
        404: {
            'description': 'Note non trouvée'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def suprrimer_note(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si la note existe
        cursor.execute("SELECT * FROM note WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Note non trouvée'}), 404
        
        cursor.execute("DELETE FROM note WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        
        return jsonify({'message': 'Note supprimée avec succès'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------------------
# API pour la table 'parcours_etudiant'
# ----------------------------------------------------------------------------------------

@app.route('/api/parcours_etudiant', methods=['GET'])
@swag_from({
    'tags': ['Parcours Etudiant'],
    'summary': 'Obtenir tous les parcours étudiants',
    'responses': {
        200: {
            'description': 'Liste de tous les parcours étudiants',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'etudiant_id': {'type': 'integer'},
                        'annee_etude_id': {'type': 'integer'}
                    }
                }
            }
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_all_parcours_etudiants():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM parcours_etudiant LEFT JOIN etudiant ON parcours_etudiant.etudiant_matricule = etudiant.matricule LEFT JOIN annee_etude ON parcours_etudiant.annee_etude_id = annee_etude.id LEFT JOIN annee_academique ON parcours_etudiant.annee_academique_id = annee_academique.id")
        parcours = cursor.fetchall()
        cursor.close()
        return jsonify(parcours), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/parcours_etudiant/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['Parcours Etudiant'],
    'summary': 'Obtenir un parcours étudiant par ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID du parcours étudiant'
        }
    ],
    'responses': {
        200: {
            'description': 'Détails du parcours étudiant'
        },
        404: {
            'description': 'Parcours étudiant non trouvé'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_parcours_etudiant(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM parcours_etudiant LEFT JOIN etudiant ON parcours_etudiant.etudiant_matricule = etudiant.matricule LEFT JOIN annee_etude ON parcours_etudiant.annee_etude_id = annee_etude.id LEFT JOIN annee_academique ON parcours_etudiant.annee_academique_id = annee_academique.id WHERE id = %s", (id,))
        parcours = cursor.fetchone()
        cursor.close()
        
        if parcours:
            return jsonify(parcours), 200
        else:
            return jsonify({'message': 'Parcours étudiant non trouvé'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/parcours_etudiant', methods=['POST'])
@swag_from({
    'tags': ['Parcours Etudiant'],
    'summary': 'Créer un nouveau parcours étudiant',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'etudiant_id': {'type': 'integer'},
                    'annee_etude_id': {'type': 'integer'}
                },
                'required': ['etudiant_id', 'annee_etude_id']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Parcours étudiant créé avec succès'
        },
        400: {
            'description': 'Données de requête invalides'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def create_parcours_etudiant():
    try:
        data = request.get_json()
        if not data or not all(field in data for field in ['etudiant_id', 'annee_etude_id']):
            return jsonify({'message': 'Champs obligatoires manquants'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """INSERT INTO parcours_etudiant (etudiant_id, annee_etude_id) 
                 VALUES (%s, %s)"""
        values = (data['etudiant_id'], data['annee_etude_id'])
        
        cursor.execute(sql, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'Parcours étudiant créé avec succès',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/parcours_etudiant/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['Parcours Etudiant'],
    'summary': 'Mettre à jour un parcours étudiant',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID du parcours étudiant'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'etudiant_id': {'type': 'integer'},
                    'annee_etude_id': {'type': 'integer'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Parcours étudiant mis à jour avec succès'
        },
        404: {
            'description': 'Parcours étudiant non trouvé'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def update_parcours_etudiant(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si le parcours existe
        cursor.execute("SELECT * FROM parcours_etudiant WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Parcours étudiant non trouvé'}), 404
        
        # Construire la requête de mise à jour
        update_fields = []
        values = []
        
        for field in ['etudiant_id', 'annee_etude_id']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Aucun champ à mettre à jour'}), 400
        
        values.append(id)  # Ajouter l'id pour la clause WHERE
        
        sql = f"UPDATE parcours_etudiant SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'Parcours étudiant mis à jour avec succès',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/parcours_etudiant/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['Parcours Etudiant'],
    'summary': 'Supprimer un parcours étudiant',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID du parcours étudiant'
        }
    ],
    'responses': {
        200: {
            'description': 'Parcours étudiant supprimé avec succès'
        },
        404: {
            'description': 'Parcours étudiant non trouvé'
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def suprrimer_parcours_etudiant(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si le parcours existe
        cursor.execute("SELECT * FROM parcours_etudiant WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Parcours étudiant non trouvé'}), 404
        
        cursor.execute("DELETE FROM parcours_etudiant WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        
        return jsonify({'message': 'Parcours étudiant supprimé avec succès'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------------------
# API pour la table 'ue'
# ----------------------------------------------------------------------------------------

@app.route('/api/ue', methods=['GET'])
@swag_from({
    'tags': ['UE'],
    'summary': 'Obtenir toutes les unités d\'enseignement',
    'responses': {
        200: {
            'description': 'Liste des UE',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'code': {'type': 'string'},
                        'nom': {'type': 'string'},
                        'annee_etude_id': {'type': 'integer'},
                        'credit': {'type': 'integer'},
                        'semestre': {'type': 'integer'}
                    }
                }
            }
        },
        500: {
            'description': 'Erreur serveur'
        }
    }
})
def get_all_ues():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ue")
        ues = cursor.fetchall()
        cursor.close()
        return jsonify(ues), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ue/<int:id>', methods=['GET'])
@swag_from({
    'tags': ['UE'],
    'summary': 'Obtenir une UE par ID',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'UE'
        }
    ],
    'responses': {
        200: {'description': 'Détails de l\'UE'},
        404: {'description': 'UE non trouvée'},
        500: {'description': 'Erreur serveur'}
    }
})
def get_ue(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ue WHERE id = %s", (id,))
        ue = cursor.fetchone()
        cursor.close()
        if ue:
            return jsonify(ue), 200
        else:
            return jsonify({'message': 'UE non trouvée'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ue', methods=['POST'])
@swag_from({
    'tags': ['UE'],
    'summary': 'Créer une nouvelle UE',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'code': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'annee_etude_id': {'type': 'integer'},
                    'credit': {'type': 'integer'},
                    'semestre': {'type': 'integer'}
                },
                'required': ['code', 'nom', 'credit', 'semestre']
            }
        }
    ],
    'responses': {
        201: {'description': 'UE créée avec succès'},
        400: {'description': 'Données de requête invalides'},
        500: {'description': 'Erreur serveur'}
    }
})
def create_ue():
    try:
        data = request.get_json()
        if not data or not all(field in data for field in ['code', 'nom', 'credit', 'semestre']):
            return jsonify({'message': 'Champs obligatoires manquants'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """INSERT INTO ue (code, nom, annee_etude_id, credit, semestre) 
                 VALUES (%s, %s, %s, %s, %s)"""
        values = (data['code'], data['nom'], data.get('annee_etude_id'), data['credit'], data['semestre'])
        
        cursor.execute(sql, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'message': 'UE créée avec succès',
            'id': new_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ue/<int:id>', methods=['PUT'])
@swag_from({
    'tags': ['UE'],
    'summary': 'Mettre à jour une UE',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'UE'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'code': {'type': 'string'},
                    'nom': {'type': 'string'},
                    'annee_etude_id': {'type': 'integer'},
                    'credit': {'type': 'integer'},
                    'semestre': {'type': 'integer'}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'UE mise à jour avec succès'},
        404: {'description': 'UE non trouvée'},
        500: {'description': 'Erreur serveur'}
    }
})
def update_ue(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM ue WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'UE non trouvée'}), 404
        
        update_fields = []
        values = []
        
        for field in ['code', 'nom', 'annee_etude_id', 'credit', 'semestre']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Aucun champ à mettre à jour'}), 400
        
        values.append(id)
        
        sql = f"UPDATE ue SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        cursor.close()
        
        return jsonify({
            'message': 'UE mise à jour avec succès',
            'affected_rows': affected_rows
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ue/<int:id>', methods=['DELETE'])
@swag_from({
    'tags': ['UE'],
    'summary': 'Supprimer une UE',
    'parameters': [
        {
            'name': 'id',
            'in': 'path',
            'type': 'integer',
            'required': True,
            'description': 'ID de l\'UE'
        }
    ],
    'responses': {
        200: {'description': 'UE supprimée avec succès'},
        404: {'description': 'UE non trouvée'},
        500: {'description': 'Erreur serveur'}
    }
})
def suprrimer_ue(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM ue WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        return jsonify({'message': 'UE supprimée avec succès'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ------------------------------------- FIN API ---------------------------------------------------

if __name__ == '__main__':
    app.run(debug=True)