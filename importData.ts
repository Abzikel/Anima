// Primero, importamos las bibliotecas necesarias: mongoose para interactuar con MongoDB, fs para manejar archivos del sistema, 
// Anime que es nuestro modelo de datos para los animes, y path para trabajar con rutas de archivos.
import mongoose from 'mongoose';
import fs from 'fs';
import Anime from './models/anime.model'; 
import path from 'path';

// Definimos una función asincrónica para manejar la importación de datos.
const importData = async () => {
  // Intentamos conectarnos a nuestra base de datos MongoDB utilizando mongoose. 
  // Usamos 'then' para notificar si la conexión fue exitosa y 'catch' por si ocurre algún error.
  mongoose.connect('mongodb://root:example@localhost:27017/myDatabase?authSource=admin')
  .then(() => console.log("Conexion correcta a la base de datos!"))
  .catch((error) => console.error('Error de conexion:', error));

  // Leemos el archivo JSON que contiene los datos de los animes. 
  // Usamos 'fs.readFileSync' para leer el contenido del archivo y 'path.join' para construir la ruta del archivo basándonos en la ubicación actual.
  const jsonData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'anime-offline-database.json'), 'utf-8')
  );

  // Utilizamos un bloque try-catch para manejar posibles errores durante la importación de datos.
  try {
    // Recorremos cada elemento del JSON, extrayendo la información necesaria para nuestro modelo de datos.
    for (const item of jsonData.data) {
      const { title, type, episodes, status, animeSeason, synonyms, tags } = item;

      // Creamos un objeto con la información del anime según nuestro modelo.
      const animeData = {
        title,
        type,
        episodes,
        status,
        animeSeason: {
          season: animeSeason.season,
          year: animeSeason.year,
        },
        synonyms,
        tags,
      };

      // Creamos una instancia de nuestro modelo Anime y guardamos el objeto en la base de datos.
      const anime = new Anime(animeData);
      await anime.save(); // La operación save es asincrónica.
    }

    // Si todos los datos se importan correctamente, se muestra este mensaje.
    console.log('Todos los datos de anime han sido importados exitosamente.');
  } catch (error) {
    // Si ocurre un error durante la importación, se captura y muestra aquí.
    console.error('Error al importar los datos:', error);
  }

  // Independientemente del resultado de la importación, cerramos la conexión a la base de datos para liberar recursos.
  mongoose.connection.close();
};

// Llamamos a la función importData para ejecutar el proceso de importación.
importData();
