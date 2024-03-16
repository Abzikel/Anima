// Vamos a necesitar a mongoose para que nuestra aplicación pueda comunicarse con MongoDB
import mongoose from 'mongoose';

// Aquí, definimos el esquema para los refresh tokens. 
// Los refresh tokens permiten a los usuarios permanecer autenticados de forma segura sin tener que ingresar sus credenciales repetidamente.
const refreshSchema = new mongoose.Schema({
    userId: {
        // Este campo almacena una referencia al usuario asociado con el refresh token.
        type: mongoose.Schema.Types.ObjectId,
        // Es obligatorio para asegurarnos de que cada token esté asociado con un usuario.
        required: true, 
        // Esto establece una referencia al modelo 'User', permitiendo que mongoose automáticamente maneje las relaciones entre documentos.
        ref: 'User' 
    },
    // Aquí almacenamos el refresh token. Debe ser único y es obligatorio.
    token: { type: String, required: true, unique: true },
    createdAt: {
        // La fecha en que el token de refresco fue creado.
        type: Date, 
         // Por defecto, la fecha de creación es el momento actual.
        default: Date.now,
        // El token expira después de una semana (604800 segundos).
        expires: 604800 
    }
});

// Con el esquema listo, creamos un modelo. Esto es lo que realmente usamos para trabajar con los datos en nuestra aplicación.
const RefreshToken = mongoose.model('RefreshToken', refreshSchema);

// Finalmente, hacemos que este modelo esté disponible en toda nuestra aplicación, exportándolo.
export default RefreshToken;
