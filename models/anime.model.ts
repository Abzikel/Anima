// Vamos a necesitar a mongoose para que nuestra aplicación pueda comunicarse con MongoDB
import mongoose, { Document } from 'mongoose';

// Definimos una interfaz para las temporadas en las que se emiten los animes.
interface IAnimeSeason {
  // Enumeramos las posibles temporadas, incluyendo una opción 'UNDEFINED' por si acaso.
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | 'UNDEFINED'; 
   // El año es opcional, ya que no siempre se conoce.
  year?: number;
}

// Heredamos la definición de nuestra interfaz de anime a partir de Document.
interface IAnime extends Document {
  // El título del anime.
  title: string; 
  // Tipo de anime, nos permite clasificarlo según su formato.
  type: 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'UNKNOWN'; 
  // Cantidad de episodios.
  episodes: number; 
  // El estado de emisión del anime.
  status: 'FINISHED' | 'ONGOING' | 'UPCOMING' | 'UNKNOWN'; 
   // La temporada en la que se emitió el anime.
  animeSeason: IAnimeSeason;
  // Sinónimos u otros nombres por los que se conoce al anime.
  synonyms: string[]; 
  // Etiquetas para categorizar el anime por géneros o características.
  tags: string[]; 
}

// Creamos un esquema para las temporadas de anime, definiendo las propiedades esperadas y sus tipos.
const AnimeSeasonSchema = new mongoose.Schema({
  // La temporada es requerida y debe ser una de las enumeradas.
  season: { type: String, required: true, enum: ['SPRING', 'SUMMER', 'FALL', 'WINTER', 'UNDEFINED'] }, 
  // El año es un número simple 'yyyy'.
  year: { type: Number } 
});

// El esquema principal para nuestro modelo de anime, donde se especifican todas sus propiedades.
const AnimeSchema = new mongoose.Schema({
  // El título es obligatorio.
  title: { type: String, required: true }, 
  // El tipo también es obligatorio y debe coincidir con uno de los valores enumerados.
  type: { type: String, required: true, enum: ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'UNKNOWN'] }, 
  // Se requiere especificar el número de episodios.
  episodes: { type: Number, required: true }, 
  // El estado de emisión es obligatorio.
  status: { type: String, required: true, enum: ['FINISHED', 'ONGOING', 'UPCOMING', 'UNKNOWN'] }, 
  // Incluimos el esquema de temporada como subdocumento.
  animeSeason: { type: AnimeSeasonSchema, required: true }, 
  // Lista de sinónimos.
  synonyms: [{ type: String }], 
  // Lista de etiquetas.
  tags: [{ type: String }], 
});

// Con el esquema listo, creamos un modelo. Esto es lo que realmente usamos para trabajar con los datos en nuestra aplicación.
const Anime = mongoose.model<IAnime>('Anime', AnimeSchema);

// Finalmente, hacemos que este modelo esté disponible en toda nuestra aplicación, exportándolo.
export default Anime;
