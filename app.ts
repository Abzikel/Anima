// Empezamos trayendo las herramientas que necesitamos: dotenv para manejar variables de entorno, 
// express para el servidor web, mongoose para la base de datos, crypto para seguridad,
// y jwt para manejar tokens de autenticación.
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt, { VerifyErrors } from 'jsonwebtoken';

// Aquí importamos los modelos de datos que vamos a utilizar.
import Anime from './models/anime.model';
import User from './models/user.model';
import UserAnime from './models/useranime.model';
import RefreshToken from './models/refreshToken.model';

// Esta parte permite extender la definición de Request de express para añadir datos de autenticación.
declare module 'express-serve-static-core' {
  interface Request {
    authData?: any;
  }
}

// Configuración inicial de nuestra aplicación express.
const app = express();
const port = 3001;

// Middleware para procesar datos JSON en las solicitudes HTTP.
app.use(express.json());

// Conexión a la base de datos MongoDB usando mongoose.
mongoose.connect('mongodb://root:example@localhost:27017/myDatabase?authSource=admin')
  .then(() => console.log("Conexion exitosa a la base de datos!"))
  .catch((error) => console.error('Error de conexion:', error));

// Definimos un endpoint para consultar todos los animes con paginación.
app.get('/animes', async (req, res) => {
  // Extraemos y procesamos los parámetros de paginación de la solicitud.
  let { page = 1, limit = 10 } = req.query; 
  page = Number(page);
  limit = Number(limit);

  try {
    // Consulta a la base de datos filtrando y paginando los resultados.
    const animes = await Anime.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const count = await Anime.countDocuments();

    // Enviamos los datos al cliente junto con información de paginación.
    res.status(200).json({
      animes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los animes');
  }
});

// Definimos un endpoint para buscar animes con filtros específicos.
app.get('/animes/filter', async (req, res) => {
  // Procesamos los parámetros de filtrado y paginación.
  let page = Number(req.query.page) || 1;
  let limit = Number(req.query.limit) || 10;
  const { title, type, status, season, year, tags } = req.query;

  let query: Record<string, any> = {};

  // Verificamos si existe un título en el filtro
  if (typeof title === 'string') {
    // Búsqueda insensible a mayúsculas/minúsculas
    query.title = { $regex: new RegExp(title, 'i') }; 
  }

  // Verificamos si hay un tipo en el filtro
  if (typeof type === 'string') {
    query.type = type;
  }

  // Verificamos si hay un status en el filtro
  if (typeof status === 'string') {
    query.status = status;
  }

  // Verificamos si se definió una temporada en el filtro
  if (typeof season === 'string') {
    query['animeSeason.season'] = season;
  }

  // Verificamos si se escribió un año en el filtro
  if (typeof year === 'string') {
    query['animeSeason.year'] = Number(year);
  }

  // Verificamos si se agregaron etiquetas (puede ser una o un arreglo de varias)
  if (typeof tags === 'string') {
    query.tags = { $in: tags.split(',') };
  } else if (Array.isArray(tags)) {
    query.tags = { $in: tags.map(tag => tag.toString()) };
  }

  try {
    // Realizamos la consulta filtrada y paginada.
    const filteredAnimes = await Anime.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    // Obtenemos el número total de documentos para hacer la paginación
    const count = await Anime.countDocuments(query);

    // Enviamos los resultados filtrados.
    res.status(200).json({
      animes: filteredAnimes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalAnimes: count
    });
  } catch (error) {
    console.error('Error al buscar animes con filtro:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Este endpoint permite la creación de nuevos usuarios en el sistema.
app.post('/signup', async (req, res) => {
  try {
    // Extraemos los datos necesarios del cuerpo de la solicitud.
    const { username, password, email } = req.body;
    // Hasheamos la contraseña
    const { salt, hash } = hashPassword(password); 

    // Creamos un nuevo usuario con la contraseña hasheada y lo guardamos en la base de datos.
    const newUser = new User({
      username,
      password: hash, 
      salt, 
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newUser.save();

    // Devolvemos el response de la operación
    res.status(201).send('Usuario creado exitosamente.');
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Este endpoint gestiona el inicio de sesión, devolviendo un token JWT y un refresh token si las credenciales son válidas.
app.post('/login', async (req, res) => {
  // Datos de la solicitud.
  const { username, password } = req.body;

  try {
    // Intentamos autenticar al usuario y generar los tokens.
    const user = await User.findOne({ username });

    // Verificamos si el usuario existe primeramente
    if (!user) {
      return res.status(401).send('Usuario no encontrado');
    }

    // Comprobamos si la contraseña es correcta
    const { salt, hash } = hashPassword(password, user.salt);
    if (hash !== user.password) {
      return res.status(401).send('Contraseña incorrecta');
    }

    // Generar JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '15m' });

    // Generar refresh token
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    // Guardar el refresh token en la base de datos
    const newRefreshToken = new RefreshToken({
      userId: user._id,
      token: refreshToken,
    });
    await newRefreshToken.save();

    // Enviar JWT y refresh token al cliente
    res.json({ token, refreshToken });
  } catch (error) {
    console.error('Error al loggear el usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Endpoint para refrescar el JWT, permitiendo a los usuarios mantenerse autenticados de forma segura.
app.post('/token', async (req, res) => {
  // Extraemos el refresh token de la solicitud.
  const { refreshToken } = req.body;

  // Verificamos que si se haya mandado un refresh token
  if (!refreshToken) {
    return res.status(401).send('Refresh Token es requerido');
  }

  try {
    // Verificamos el refresh token y generamos un nuevo JWT si es válido.
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    // Comprobamos si el refresh token es válido o no
    if (!storedToken) {
      return res.status(403).send('Refresh Token inválido');
    }

    // Verificar el refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, (err: VerifyErrors | null, user: any) => {
      // Informamos al usaurio de un error
      if (err) {
        return res.status(403).send('Refresh Token inválido o expirado');
      }
    
      // Verificar el objeto 'User' este completo
      if (!user || !user.userId) {
        return res.status(403).send('Error en la información del usuario');
      }
    
      // Generar un nuevo JWT que expira en 15 min
      const newToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    
      res.json({ token: newToken });
    });
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Este endpoint maneja el cierre de sesión, invalidando el refresh token para prevenir su uso futuro.
app.post('/logout', async (req, res) => {
  // El cliente debe enviar el refresh token
  const { refreshToken } = req.body; 

  if (!refreshToken) {
    return res.status(400).send('Refresh Token es requerido');
  }

  try {
    // Intentamos encontrar y eliminar el refresh token de la base de datos
    const deletedToken = await RefreshToken.findOneAndDelete({ token: refreshToken });

    if (!deletedToken) {
      // Si no se encuentra el token, puede que ya haya sido eliminado o nunca existió
      return res.status(404).send('Refresh Token no encontrado o ya invalidado');
    }

    // Si se encuentra y elimina el token, se considera una "sesión" cerrada con éxito
    res.status(200).send('Sesión cerrada con éxito');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Este endpoint permite a los usuarios autenticados calificar animes. 
// Primero, se verifica que el usuario esté autenticado mediante el uso de 'verifyToken'.
app.post('/rateAnime', verifyToken, async (req: Request, res: Response) => {
  // Extraemos el ID del usuario y los detalles de la calificación desde el cuerpo de la solicitud.
  const userId = req.authData.userId; 
  const { animeId, score } = req.body;

  // Verificamos si el anime especificado existe en la base de datos.
  const animeExists = await Anime.findById(animeId);
  if (!animeExists) {
    // Si no encontramos el anime, devolvemos un error.
    return res.status(404).send('Anime no encontrado.');
  }

  // Validar que la puntuación sea un número entre 1 y 10
  if (typeof score !== 'number' || score < 1 || score > 10) {
    return res.status(400).send('La calificación debe ser un número entre 1 y 10.');
  }

  try {
    // Buscar si ya existe un registro para este usuario y anime
    let userAnime = await UserAnime.findOne({ userId, animeId });

    if (userAnime) {
      // Si ya existe, actualizar la calificación
      userAnime.score = score;
    } else {
      // Si no existe, crear un nuevo registro
      userAnime = new UserAnime({
        userId,
        animeId,
        score,
        watched: false, 
        wantToWatch: false,
        favorite: false
      });
    }

    // Guardamos los cambios en la base de datos.
    await userAnime.save();

    // Devolvemos response de que el anime fue calificado exitosamente
    res.status(200).send('Anime calificado exitosamente.');
  } catch (error) {
    console.error('Error al calificar el anime:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Este endpoint permite a los usuarios autenticados agregar animes a su lista de "por ver".
app.post('/watchlist/add', verifyToken, async (req, res) => {
  const userId = req.authData.userId;
  const { animeId } = req.body;

  try {
    // Buscamos si el usuario ya tiene este anime en su lista.
    let userAnime = await UserAnime.findOne({ userId, animeId });

    if (userAnime) {
      // Si ya existe, simplemente actualizamos su estado a "por ver".
      userAnime.wantToWatch = true;
      userAnime.watched = false;
    } else {
      // Si no existe, creamos un nuevo registro en la lista de por ver.
      userAnime = new UserAnime({
        userId,
        animeId,
        wantToWatch: true,
        watched: false
      });
    }

    // Guardamos los cambios.
    await userAnime.save();
    return res.status(201).send('Anime agregado a la lista de por ver y marcado como no visto.');
  } catch (error) {
    // En caso de error, informamos al usuario.
    console.error('Error al modificar la lista de por ver:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Este endpoint permite a los usuarios autenticados consultar su lista de animes "por ver".
app.get('/watchlist', verifyToken, async (req, res) => {
  // Aquí manejamos la paginación para no sobrecargar al cliente con demasiados datos de una vez.
  const userId = req.authData.userId;
  let { page = 1, limit = 10 } = req.query;
  page = Number(page);
  limit = Number(limit);

  try {
    // Buscar animes en la lista de "quiero ver" del usuario
    const watchlistItems = await UserAnime.find({ userId, wantToWatch: true })
      .populate('animeId')
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    // Contamos la cantidad total de elementos para la paginación.
    const count = await UserAnime.countDocuments({ userId, wantToWatch: true });

    // Mapear los resultados para incluir detalles relevantes
    const animes = watchlistItems.map(item => {
      return {
        animeInfo: item.animeId, // Este objeto contiene todos los detalles del anime proporcionados por el modelo
        score: item.score, // Incluye la calificación del anime
        watched: item.watched, // Indica si el usuario ya ha visto el anime
        wantToWatch: item.wantToWatch, // Indica si el anime esta por verse
        favorite: item.favorite // Indica si el anime es uno de los favoritos del usuario
      };
    });

    // Devolvemos la lista paginada de animes.
    res.status(200).json({
      animes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error al consultar la lista de por ver:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Esta endpoint te permite añadir un anime a tu lista de vistos.
app.post('/watched/add', verifyToken, async (req, res) => {
  // Sacamos el ID del usuario y el del anime de la información recibida en la solicitud.
  const userId = req.authData.userId;
  const { animeId } = req.body;

  try {
    // Buscamos si el usuario tiene este anime en alguna lista.
    let userAnime = await UserAnime.findOne({ userId, animeId });

    if (userAnime) {
      // Si ya existe, simplemente actualizamos su estado a "visto".
      userAnime.watched = true;
      userAnime.wantToWatch = false;
    } else {
      // Si no, creamos un nuevo registro en la lista de vistos.
      userAnime = new UserAnime({
        userId,
        animeId,
        watched: true,
        wantToWatch: false
      });
    }

    // Guardamos los cambios.
    await userAnime.save();
    return res.status(201).send('Anime marcado como visto y quitado de la lista de por ver.');
  } catch (error) {
    console.error('Error al modificar la lista de vistos:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Esta endpoint muestra todos los animes marcadso como vistos, con paginación para que sea más manejable.
app.get('/watched', verifyToken, async (req, res) => {
  // Tomamos el UserId para buscar solo sus animes.
  const userId = req.authData.userId;

  // También tomamos parámetros para la paginación.
  let { page = 1, limit = 10 } = req.query;
  page = Number(page);
  limit = Number(limit);

  try {
    // Aquí obtenemos la lista de animes vistos.
    const watchedItems = await UserAnime.find({ userId, watched: true })
      .populate('animeId') 
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    // Contamos cuántos animes vistos hay total para la paginación.
    const count = await UserAnime.countDocuments({ userId, watched: true });

    // Armamos una lista con toda la información.
    const animes = watchedItems.map(item => ({
      animeInfo: item.animeId, // Datos del anime
      score: item.score, // Calificación dada por el usuario
      wantToWatch: item.wantToWatch, // Si el usuario tiene pleando ver el anime
      watched: item.watched, // Será siempre true aquí
      favorite: item.favorite // Si es favorito
    }));

    // Devolvemos esa lista.
    res.status(200).json({
      animes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error al consultar la lista de animes vistos:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Este endpoint permite marcar un anime como uno de tus favoritos.
app.post('/favorites/add', verifyToken, async (req, res) => {
  const userId = req.authData.userId;
  const { animeId } = req.body;

  try {
    // Primero, vemos si este anime está en alguna lista.
    let userAnime = await UserAnime.findOne({ userId, animeId });

    if (userAnime) {
      // Si el anime ya está marcado como favorito, notificar al usuario
      if (userAnime.favorite) {
        return res.status(400).send('Este anime ya está en tus favoritos.');
      }

      // Si ya existe pero no está marcado como favorito, actualizarlo
      userAnime.favorite = true;
      await userAnime.save();
      return res.status(200).send('Anime agregado a favoritos.');
    } else {
      // Si no existe, crear un nuevo registro
      userAnime = new UserAnime({
        userId,
        animeId,
        favorite: true
      });
      await userAnime.save();
      return res.status(201).send('Anime agregado a favoritos.');
    }
  } catch (error) {
    console.error('Error al agregar anime a favoritos:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Con este endpoint se pueden ver todos los animes favoritos del usaurio por paginación.
app.get('/favorites', verifyToken, async (req, res) => {
  const userId = req.authData.userId;

  // Recogemos los parámetros para la paginación.
  let { page = 1, limit = 10 } = req.query;
  page = Number(page);
  limit = Number(limit);

  try {
    // Buscamos los favoritos en la base de datos.
    const favoriteItems = await UserAnime.find({ userId, favorite: true })
      .populate('animeId')
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    // Calculamos el total de favoritos para la paginación.
    const count = await UserAnime.countDocuments({ userId, favorite: true });

    // Creamos la lista
    const animes = favoriteItems.map(item => ({
      animeInfo: item.animeId, // Datos del anime
      score: item.score, // Calificación dada por el usuario, si existe
      wantToWatch: item.wantToWatch, // Si el usuario tiene pleando ver el anime
      watched: item.watched, // Si el usuario ha visto el anime
      favorite: item.favorite // Será siempre true aquí
    }));

    res.status(200).json({
      animes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error al consultar la lista de animes favoritos:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Está función sirve para poder hashear la contraseña, sirve tanto para el registro como para el login
function hashPassword(password: string, salt?: string): { salt: string, hash: string } {
  // Usa el salt proporcionado o genera uno nuevo dependiendo el caso
  salt = salt || crypto.randomBytes(16).toString('hex'); 
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Función para verificar el token de autenticación
function verifyToken(req: Request, res: Response, next: NextFunction) {
  // Obtener el token del header de autorización
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];

    // Asegurarse de que JWT_SECRET esté definido
    const secret = process.env.JWT_SECRET;
    if (typeof secret === 'undefined') {
      console.error('JWT_SECRET no está definido en el entorno');
       // Error interno del servidor
      res.sendStatus(500);
      return;
    }

    // Verificar el token
    jwt.verify(bearerToken, secret, (err, authData) => {
      if (err) {
        // Si hay un error o el token es inválido
        res.sendStatus(401);
      } else {
        // Si el token es verificado correctamente, pasar al siguiente middleware
        req.authData = authData;
        next();
      }
    });
  } else {
    // Si no hay token en el header, rechazar la solicitud
    res.sendStatus(401);
  }
}

// Finalmente, se inicia el servidor escuchando en el puerto configurado, listo para aceptar solicitudes.
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
