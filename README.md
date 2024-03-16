# Estructura de la Base de Datos

La aplicación utiliza MongoDB como sistema de gestión de base de datos, con Mongoose para modelar la información. A continuación, se describen los modelos utilizados y sus campos.

![Diagrama de la estructura de la base de datos](images/Diagram.png)

## Modelos

### Anime

Representa los animes dentro de la base de datos.

- **Campos**:
  - `title`: Título del anime (String, requerido).
  - `type`: Tipo de anime (Enum: 'TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'UNKNOWN', requerido).
  - `episodes`: Número de episodios (Number, requerido).
  - `status`: Estado de emisión del anime (Enum: 'FINISHED', 'ONGOING', 'UPCOMING', 'UNKNOWN', requerido).
  - `animeSeason`: Temporada en la que se emitió el anime, incluyendo `season` y `year` (Objeto, requerido).
    - `season`: Temporada de emisión (Enum: 'SPRING', 'SUMMER', 'FALL', 'WINTER', 'UNDEFINED', requerido).
    - `year`: Año de la temporada de emisión (Number).
  - `synonyms`: Sinónimos o títulos alternativos (Array de Strings).
  - `tags`: Etiquetas o géneros asociados al anime (Array de Strings).

### User

Representa a los usuarios de la aplicación.

- **Campos**:
  - `username`: Nombre de usuario (String, único, requerido).
  - `password`: Hash de la contraseña (String, requerido).
  - `salt`: Salt utilizado para hashear la contraseña (String, requerido).
  - `email`: Correo electrónico del usuario (String, único, requerido).
  - `createdAt`: Fecha de creación del usuario (Date, por defecto: Fecha actual).
  - `updatedAt`: Fecha de la última actualización del usuario (Date, por defecto: Fecha actual).

### UserAnime

Relaciona a los usuarios con los animes y guarda información sobre la interacción del usuario con el anime.

- **Campos**:
  - `userId`: Referencia al usuario (ObjectId, ref: 'User', requerido).
  - `animeId`: Referencia al anime (ObjectId, ref: 'Anime', requerido).
  - `score`: Calificación otorgada por el usuario al anime (Number, opcional).
  - `watched`: Indica si el usuario ha visto el anime (Boolean, por defecto: false).
  - `wantToWatch`: Indica si el anime está en la lista de "por ver" del usuario (Boolean, por defecto: false).
  - `favorite`: Indica si el anime es uno de los favoritos del usuario (Boolean, por defecto: false).

## Relaciones

- Cada **Anime** puede estar asociado a múltiples **UserAnime**.
- Cada **User** puede tener múltiples **UserAnime**, representando animes vistos, por ver, favoritos y calificados.

# Configuración de MongoDB

Este proyecto utiliza **MongoDB** como sistema de gestión de base de datos. Para asegurar una conexión exitosa a tu instancia de MongoDB, es importante que configures las credenciales correctamente.

## Credenciales Predeterminadas

Las credenciales por defecto utilizadas en el proyecto son:

- **Nombre de usuario**: `root`
- **Contraseña**: `example`

Estas credenciales se utilizan tanto en el archivo `docker-compose.yml` para la configuración del servicio de MongoDB, como en los archivos de conexión de la aplicación (`app.ts` y `importData.ts`).

### Docker Compose

En el archivo `docker-compose.yml`, encontrarás la configuración del servicio `mongodb` que incluye las credenciales predeterminadas:

```yaml
environment:
  MONGO_INITDB_ROOT_USERNAME: root
  MONGO_INITDB_ROOT_PASSWORD: example
```

## Archivos de conexión

Las cadenas de conexión dentro de los archivos `app.ts` y `importData.ts` también incorporan estas credenciales:

```bash
mongoose.connect('mongodb://root:example@localhost:27017/myDatabase?authSource=admin');
```

## Modificación de Credenciales

Si tus credenciales de MongoDB son diferentes o si deseas cambiar las credenciales por razones de seguridad, es necesario que actualices tanto el archivo `docker-compose.yml` como las cadenas de conexión en `app.ts` y `importData.ts`.

Esta modificación garantizará que la aplicación se pueda conectar sin problemas a tu base de datos MongoDB.

# Inicialización de la Base de Datos con Datos de Animes

Para inicializar la base de datos con un conjunto de datos de animes precargados, he preparado un script que importará datos desde un archivo JSON directamente a la base de datos MongoDB. Sigue los pasos a continuación para realizar la importación de datos.

## Origen de los Datos

Los datos utilizados para la inicialización de la base de datos provienen del proyecto [anime-offline-database](https://github.com/manami-project/anime-offline-database.git) en GitHub. Este proyecto compila una extensa base de datos de animes recopilada de diversas fuentes y la pone a disposición en formato JSON, lo que facilita su uso en aplicaciones como esta.

El modelo de `Anime` de esta aplicación se diseñó tomando como referencia la estructura de los datos proporcionados por el anime-offline-database. Esto nos asegura que los datos importados se alineen correctamente con nuestro esquema, solamente se quitaron algunos datos que consideré que no eran necesarios.

## Requisitos Previos

Antes de proceder, asegúrate de tener los siguientes requisitos previos cumplidos:

- MongoDB instalado y ejecutándose en tu sistema.
- Node.js y npm instalados.
- El archivo llamado `anime-offline-database.json` que contenga los datos de animes (el cual esta en este mismo repositorio).

## Pasos para la Importación de Datos

1. **Coloca el Archivo de Datos en el Proyecto**: Asegúrate de que el archivo `anime-offline-database.json` esté ubicado en la raíz de tu proyecto, o ajusta la ruta en el script de importación según corresponda.

2. **Ejecutar el Script de Importación**: Abre una terminal en la raíz de tu proyecto y ejecuta el script de importación con Node.js:

    ```bash
    node path/to/importData.js
    ```

    Asegúrate de reemplazar `path/to/importData.js` con la ruta correcta al archivo que contiene el script de importación.

3. **Verificación**: Una vez completado el script, deberías ver un mensaje indicando que todos los datos han sido importados exitosamente. Puedes verificar los datos importados conectándote a tu base de datos MongoDB usando una herramienta como MongoDB Compass o en todo caso ejecutar alguno de los endpoints que se presentan más adelante.

## Notas Adicionales

- Este script borrará cualquier dato existente en la colección de `animes` antes de importar los nuevos datos para evitar duplicados.

# Guía de Uso de los Endpoints de la API de Animes

## Consulta de Todos los Animes con Paginación

Para obtener una lista de todos los animes disponibles en la base de datos con soporte de paginación:

**Endpoint**: `GET /animes`

**Parámetros de Consulta**:
- `page` (opcional): El número de página que deseas consultar. Por defecto es `1`.
- `limit` (opcional): La cantidad de ítems por página. Por defecto es `10`.

### Ejemplo de Uso:

Para obtener la primera página de animes con 10 ítems por página:

GET 
```bash
http://localhost:3001/animes?page=1&limit=10
```

Para cambiar de página, simplemente ajusta el valor del parámetro `page`.

## Consulta de Animes por Filtro

Para buscar animes usando varios filtros y con soporte de paginación:

**Endpoint**: `GET /animes/filter`

**Parámetros de Consulta**:
- `title` (opcional): Buscar animes por título.
- `type` (opcional): Tipo de anime (`TV`, `MOVIE`, `OVA`, `ONA`, `SPECIAL`, `UNKNOWN`).
- `status` (opcional): Estado del anime (`FINISHED`, `ONGOING`, `UPCOMING`, `UNKNOWN`).
- `season` (opcional): Temporada de lanzamiento (`SPRING`, `SUMMER`, `FALL`, `WINTER`, `UNDEFINED`).
- `year` (opcional): Año de la temporada de lanzamiento.
- `tags` (opcional): Etiquetas o géneros asociados al anime.
- `page` (opcional): Número de página para paginación.
- `limit` (opcional): Cantidad de ítems por página para paginación.

### Ejemplos de Uso:

Buscar animes por tipo `MOVIE` y estado `FINISHED`, mostrando 5 ítems por página en la página 2:

GET 
```bash
http://localhost:3001/animes/filter?type=MOVIE&status=FINISHED&limit=5&page=2
```

Buscar animes lanzados en la temporada de `FALL` del año `2020`, incluyendo paginación:

GET 
```bash
http://localhost:3001/animes/filter?season=FALL&year=2020&page=1&limit=10
```

Combinando múltiples filtros, incluyendo tipo, estado, temporada, año y etiquetas, con paginación:

GET 
```bash
http://localhost:3001/animes/filter?type=SPECIAL&status=FINISHED&season=FALL&year=2020&tags=music&page=1&limit=10
```

### Posibles Valores para Filtros Específicos

**type**:
- `TV`
- `MOVIE`
- `OVA`
- `ONA`
- `SPECIAL`
- `UNKNOWN`

**status**:
- `FINISHED`
- `ONGOING`
- `UPCOMING`
- `UNKNOWN`

**season**:
- `SPRING`
- `SUMMER`
- `FALL`
- `WINTER`
- `UNDEFINED`

## Creación de Usuario (Signup)

Para crear un nuevo usuario en la base de datos, debes enviar una solicitud `POST` al endpoint `/signup`. Esto requerirá que proporciones detalles del usuario como el nombre de usuario, correo electrónico y contraseña.

**Endpoint**: `POST /signup`

### Cuerpo de la Solicitud

La solicitud debe incluir un cuerpo con formato JSON conteniendo el nombre de usuario, la contraseña y el correo electrónico del nuevo usuario.

```json
{
  "username": "username",
  "password": "password",
  "email": "email@example.com"
}
```

## Inicio de Sesión (Login)

Para iniciar sesión y obtener un token de acceso junto con un token de actualización, envía una solicitud `POST` al endpoint `/login`. Deberás incluir el nombre de usuario y la contraseña del usuario en el cuerpo de la solicitud.

**Endpoint**: `POST /login`

### Cuerpo de la Solicitud

La solicitud debe contener un cuerpo con formato JSON incluyendo el nombre de usuario y la contraseña del usuario que intenta iniciar sesión.

```json
{
  "username": "username",
  "password": "password"
}
```

## Cierre de Sesión (Logout)

Para cerrar sesión y invalidar el token de actualización, debes enviar una solicitud `POST` al endpoint `/logout`, incluyendo el refresh token que deseas invalidar.

**Endpoint**: `POST /logout`

### Cuerpo de la Solicitud

La solicitud debe incluir un cuerpo con formato JSON conteniendo el refresh token que se desea invalidar.

```json
{
  "refreshToken": "refreshToken"
}
```

## Calificar un Anime (Rate Anime)

Para calificar un anime, los usuarios autenticados deben enviar una solicitud `POST` al endpoint `/rateAnime`. Este endpoint requiere que el usuario esté autenticado y que envíe un JWT token válido en el header de la solicitud.

**Endpoint**: `POST /rateAnime`

### Headers

- `Authorization`: Deberás incluir el token JWT en el formato `Bearer JWT_Token`. Asegúrate de reemplazar `JWT_Token` con el token que recibiste al iniciar sesión.

    Ejemplo: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWY0ZGY3MTgzZjdhODJhYTA2M2E2YmYiLCJpYXQiOjE3MTA1NTUzNDIsImV4cCI6MTcxMDU1NjI0Mn0.OgmrbtAUpPAczpVkrg6W1QuG_XyBhHkdgAuIF8n5cFM`

### Cuerpo de la Solicitud

La solicitud debe incluir un cuerpo con formato JSON conteniendo el ID del anime que se desea calificar y la calificación asignada.

```json
{
  "animeId": "id_del_anime_aquí",
  "score": 8
}
```

## Agregar Anime a Lista de "Por Ver"

Para marcar un anime como "quiero verlo", los usuarios autenticados deben enviar una solicitud `POST` al endpoint `/watchlist/add`. Este endpoint requiere que el usuario esté autenticado y que envíe un JWT token válido en el header de la solicitud. Ten en cuenta que si el anime esta en "Visto" se quitará de visto y pasará a "Por Ver" ya que estos dos etados no pueden ser verdaderos al mismo tiempo.

**Endpoint**: `POST /watchlist/add`

### Headers

- `Authorization`: Deberás incluir el token JWT en el formato `Bearer JWT_Token`. Asegúrate de reemplazar `JWT_Token` con el token que recibiste al iniciar sesión.

### Cuerpo de la Solicitud

La solicitud debe incluir un cuerpo con formato JSON conteniendo el ID del anime que se desea agregar a la lista de "por ver".

```json
{
  "animeId": "id_del_anime_a_agregar"
}
```

## Consulta de Lista de Animes "Por Ver"

Para consultar la lista de animes marcados como "animes por ver", los usuarios autenticados pueden enviar una solicitud `GET` al endpoint `/watchlist`. Este endpoint admite paginación y requiere autenticación mediante JWT. Además de regresar la información completa del anime también regresará información con respecto al usuario, en este caso la calificación que le ha puesto, si esta en la lista de quiero ver, si esta en la lista de visto y si está en la lista de favoritos.

**Endpoint**: `GET /watchlist`

### Headers

- `Authorization`: Incluye el token JWT en el formato `Bearer JWT_Token`.

### Parámetros de Consulta

- `page` (opcional): El número de página que deseas consultar. Por defecto es `1`.
- `limit` (opcional): La cantidad de ítems por página. Por defecto es `10`.

### Ejemplo de Uso:

Para consultar tu lista de animes "por ver" con paginación:

GET 
```bash
http://localhost:3001/watchlist?page=1&limit=10
```

Ajusta los parámetros `page` y `limit` según sea necesario para tu consulta.

## Agregar Anime a Lista de "Visto"

Para marcar un anime como "visto", los usuarios autenticados deben enviar una solicitud `POST` al endpoint `/watched/add`. Este endpoint requiere que el usuario esté autenticado y que envíe un JWT token válido en el header de la solicitud. Ten en cuenta que si el anime esta en "Por Ver" se quitará de por ver y pasará a "Visto" ya que estos dos etados no pueden ser verdaderos al mismo tiempo.

**Endpoint**: `POST /watched/add`

### Headers

- `Authorization`: Deberás incluir el token JWT en el formato `Bearer JWT_Token`. Asegúrate de reemplazar `JWT_Token` con el token que recibiste al iniciar sesión.

### Cuerpo de la Solicitud

La solicitud debe incluir un cuerpo con formato JSON conteniendo el ID del anime que se desea agregar a la lista de "visto".

```json
{
  "animeId": "id_del_anime_a_agregar"
}
```

## Consulta de Lista de Animes "Visto"

Para consultar la lista de animes marcados como "animes vistos", los usuarios autenticados pueden enviar una solicitud `GET` al endpoint `/watched`. Este endpoint admite paginación y requiere autenticación mediante JWT. Además de regresar la información completa del anime también regresará información con respecto al usuario, en este caso la calificación que le ha puesto, si esta en la lista de quiero ver, si esta en la lista de visto y si está en la lista de favoritos.

**Endpoint**: `GET /watched`

### Headers

- `Authorization`: Incluye el token JWT en el formato `Bearer JWT_Token`.

### Parámetros de Consulta

- `page` (opcional): El número de página que deseas consultar. Por defecto es `1`.
- `limit` (opcional): La cantidad de ítems por página. Por defecto es `10`.

### Ejemplo de Uso:

Para consultar tu lista de animes "vistos" con paginación:

GET 
```bash
http://localhost:3001/watched?page=1&limit=10
```

Ajusta los parámetros `page` y `limit` según sea necesario para tu consulta.

## Agregar Anime a Lista de "Favoritos"

Para marcar un anime como "favoritos", los usuarios autenticados deben enviar una solicitud `POST` al endpoint `/favorites/add`. Este endpoint requiere que el usuario esté autenticado y que envíe un JWT token válido en el header de la solicitud.

**Endpoint**: `POST /favorites/add`

### Headers

- `Authorization`: Deberás incluir el token JWT en el formato `Bearer JWT_Token`. Asegúrate de reemplazar `JWT_Token` con el token que recibiste al iniciar sesión.

### Cuerpo de la Solicitud

La solicitud debe incluir un cuerpo con formato JSON conteniendo el ID del anime que se desea agregar a la lista de "favoritos".

```json
{
  "animeId": "id_del_anime_a_agregar"
}
```

## Consulta de Lista de Animes "Favoritos"

Para consultar la lista de animes marcados como "animes favoritos", los usuarios autenticados pueden enviar una solicitud `GET` al endpoint `/favorites`. Este endpoint admite paginación y requiere autenticación mediante JWT. Además de regresar la información completa del anime también regresará información con respecto al usuario, en este caso la calificación que le ha puesto, si esta en la lista de quiero ver, si esta en la lista de visto y si está en la lista de favoritos.

**Endpoint**: `GET /favorites`

### Headers

- `Authorization`: Incluye el token JWT en el formato `Bearer JWT_Token`.

### Parámetros de Consulta

- `page` (opcional): El número de página que deseas consultar. Por defecto es `1`.
- `limit` (opcional): La cantidad de ítems por página. Por defecto es `10`.

### Ejemplo de Uso:

Para consultar tu lista de animes "favoritos" con paginación:

GET 
```bash
http://localhost:3001/favorites?page=1&limit=10
```

Ajusta los parámetros `page` y `limit` según sea necesario para tu consulta.