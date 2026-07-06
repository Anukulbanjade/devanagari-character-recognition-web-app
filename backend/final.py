import os
import cv2
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
from gtts import gTTS
from keras.models import load_model
import logging
from werkzeug.utils import secure_filename

# Init app and config
load_dotenv()
app = Flask(__name__)
CORS(app)

app.config.update(
   SECRET_KEY=os.getenv('SECRET_KEY'),
   SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL'),
   SQLALCHEMY_TRACK_MODIFICATIONS=False,
   UPLOAD_FOLDER=os.getenv('UPLOAD_FOLDER', 'uploads'),
   AUDIO_FOLDER='audio',
   MODEL_PATH=os.getenv('MODEL_PATH', 'models/devanagari.h5'),
   JWT_EXPIRATION_HOURS=24,
   MAX_CONTENT_LENGTH=16 * 1024 * 1024
)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['AUDIO_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# Load model
try:
   model = load_model(app.config['MODEL_PATH'])
except Exception as e:
   model = None

letter_map = {
   0: 'CHECK', 1: 'क', 2: 'ख', 3: 'ग', 4: 'घ', 5: 'ङ', 6: 'च',
   7: 'छ', 8: 'ज', 9: 'झ', 10: 'ञ', 11: 'ट', 12: 'ठ', 13: 'ड',
   14: 'ढ', 15: 'ण', 16: 'त', 17: 'थ', 18: 'द', 19: 'ध', 20: 'न',
   21: 'प', 22: 'फ', 23: 'ब', 24: 'भ', 25: 'म', 26: 'य', 27: 'र',
   28: 'ल', 29: 'व', 30: 'श', 31: 'ष', 32: 'स', 33: 'ह',
   34: 'क्ष', 35: 'त्र', 36: 'ज्ञ'
}

# Models
class User(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   username = db.Column(db.String(50), unique=True, nullable=False)
   email = db.Column(db.String(120), unique=True, nullable=False)
   password = db.Column(db.String(255), nullable=False)
   predictions = db.relationship('Prediction', backref='user', lazy=True)

class Prediction(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
   filename = db.Column(db.String(255), nullable=False) 
   prediction = db.Column(db.String(10), nullable=False)
   confidence = db.Column(db.Float, nullable=False)

with app.app_context():
   db.create_all()

# Auth decorator
def token_required(f):
   @wraps(f)
   def decorated(*args, **kwargs):
       auth_header = request.headers.get('Authorization', '')
       if not auth_header or not auth_header.startswith('Bearer '):
           return jsonify({'status': 'error', 'message': 'Invalid auth header'}), 401
           
       try:
           token = auth_header.split(' ')[1]
           data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
           current_user = User.query.get(data['user_id'])
           if not current_user:
               return jsonify({'status': 'error', 'message': 'User not found'}), 401
       except:
           return jsonify({'status': 'error', 'message': 'Invalid token'}), 401
           
       return f(current_user, *args, **kwargs)
   return decorated

# Routes
@app.route('/api/signup', methods=['POST'])
def signup():
   try:
       data = request.get_json()
       
       if User.query.filter_by(email=data['email']).first():
           return jsonify({
               'status': 'error',
               'message': 'Email exists'
           }), 400

       user = User(
           username=data['username'],
           email=data['email'],
           password=generate_password_hash(data['password'])
       )
       db.session.add(user)
       db.session.commit()
       
       return jsonify({
           'status': 'success',
           'message': 'User created'
       }), 201
       
   except Exception as e:
       return jsonify({
           'status': 'error',
           'message': str(e)
       }), 500

@app.route('/api/signin', methods=['POST'])
def signin():
   try:
       data = request.get_json()
       user = User.query.filter_by(email=data['email']).first()
       
       if not user or not check_password_hash(user.password, data['password']):
           return jsonify({
               'status': 'error',
               'message': 'Invalid credentials'
           }), 401
           
       token = jwt.encode({
           'user_id': user.id,
           'exp': datetime.utcnow() + timedelta(hours=24)
       }, app.config['SECRET_KEY'])
       
       return jsonify({
           'status': 'success',
           'data': {'token': token}
       })
       
   except Exception as e:
       return jsonify({
           'status': 'error',
           'message': str(e)
       }), 500

@app.route('/api/predict', methods=['POST'])
@token_required 
def predict(current_user):
   if not model:
       return jsonify({'status': 'error', 'message': 'Model not loaded'}), 500
       
   if 'image' not in request.files:
       return jsonify({'status': 'error', 'message': 'No image'}), 400

   try:
       image_file = request.files['image']
       if not allowed_file(image_file.filename):
           return jsonify({'status': 'error', 'message': 'Invalid file type'}), 400

       # Process image
       nparr = np.frombuffer(image_file.read(), np.uint8)
       img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
       
       # Resize and preprocess
       img = cv2.resize(img, (32, 32))
       img = img.astype('float32') / 255
       img = np.expand_dims(img, axis=[0,3])

       # Predict
       pred = model.predict(img)[0]
       pred_class = np.argmax(pred)
       confidence = float(pred[pred_class])
       text = letter_map[pred_class]

       # Save prediction
       filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{image_file.filename}")
       
       prediction = Prediction(
           user_id=current_user.id,
           filename=filename,
           prediction=text,
           confidence=confidence
       )
       db.session.add(prediction)
       db.session.commit()

       return jsonify({
           'status': 'success',
           'data': {
               'text': text,
               'characters': [{
                   'id': prediction.id,
                   'character': text,
                   'confidence': confidence
               }]
           }
       })

   except Exception as e:
       return jsonify({
           'status': 'error',
           'message': str(e)
       }), 500

@app.route('/api/generate-audio/<string:text>', methods=['GET'])
@token_required
def generate_audio(current_user, text):
   try:
       text = text.encode('utf-8').decode('unicode-escape')
       
       audio_file = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3"
       audio_path = os.path.join(app.config['AUDIO_FOLDER'], audio_file)
       
       tts = gTTS(text=text, lang='ne')
       tts.save(audio_path)
       
       response = send_file(
           audio_path,
           mimetype='audio/mpeg',
           as_attachment=True,
           download_name=audio_file
       )
       response.headers['Cache-Control'] = 'no-cache'
       return response

   except Exception as e:
       return jsonify({
           'status': 'error',
           'message': str(e)
       }), 500

if __name__ == '__main__':
   app.run(debug=True)