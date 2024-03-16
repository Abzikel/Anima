// Vamos a necesitar a mongoose para que nuestra aplicación pueda comunicarse con MongoDB
import mongoose, { Document } from 'mongoose';

// Aquí estamos creando una "interfaz", que es básicamente un contrato que dice cómo debe ser la relación entre un usuario y un anime. 
// Esto incluye cosas como la puntuación que el usuario da al anime, si lo ha visto, si quiere verlo, o si es uno de sus favoritos.
interface IUserAnime extends Document {
  // Identificador único del usuario
  userId: mongoose.Schema.Types.ObjectId; 
  // Identificador único del anime
  animeId: mongoose.Schema.Types.ObjectId; 
  // La puntuación que el usuario da al anime
  score: number; 
   // Si el usuario ya vio el anime
  watched: boolean;
  // Si el usuario quiere ver el anime
  wantToWatch: boolean; 
   // Si el anime es uno de los favoritos del usuario
  favorite: boolean;
}

// Basándonos en la interfaz anterior, definimos un "esquema" que describe cómo se guardará esta relación en la base de datos.
// Esto incluye qué campos son obligatorios, qué tipo de datos esperamos, etc.
const UserAnimeSchema = new mongoose.Schema({
  // Enlace al usuario (obligatorio)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  // Enlace al anime (obligatorio)
  animeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Anime', required: true }, 
  // La puntuación es opcional
  score: { type: Number, required: false }, 
  // Por defecto, no se ha visto
  watched: { type: Boolean, default: false }, 
  // Por defecto, no está en la lista de deseos
  wantToWatch: { type: Boolean, default: false }, 
  // Por defecto, no es favorito
  favorite: { type: Boolean, default: false }, 
});

// Con el esquema listo, creamos un modelo. Esto es lo que realmente usamos para trabajar con los datos en nuestra aplicación.
const UserAnime = mongoose.model<IUserAnime>('UserAnime', UserAnimeSchema);

// Finalmente, hacemos que este modelo esté disponible en toda nuestra aplicación, exportándolo.
export default UserAnime;
