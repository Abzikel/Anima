// Vamos a necesitar a mongoose para que nuestra aplicación pueda comunicarse con MongoDB
import mongoose, { Document } from 'mongoose';

// Aquí estamos creando una "interfaz", que es básicamente un contrato que dice cómo debe ser la el usuario. 
// Esto incluye cosas como la el nombre de usuario, contraseña, el correo, fecha de creación y actualización.
interface IUser extends Document {
  // El nombre de usuario
  username: string; 
   // La contraseña del usuario
  password: string;
  // El salt para guardar la contraseña hasheada y tener mayor seguridad
  salt: string; 
  // El correo del usuario
  email: string; 
  // La fecha de cuando se creo el usaurio
  createdAt: Date; 
  // La fecha de cuando se acutalizo el usaurio
  updatedAt: Date; 
}

// Basándonos en la interfaz anterior, definimos un "esquema" que describe cómo se guardará modelo en la base de datos.
// Esto incluye qué campos son obligatorios, qué tipo de datos esperamos, etc.
const UserSchema = new mongoose.Schema({
  // Se requiere un nombre de usuario y debe ser unico
  username: { type: String, required: true, unique: true }, 
  // Se requiere una contraseña a fuerzas
  password: { type: String, required: true }, 
  // Se requiere igualmente el salt para la contraseña más segura
  salt: { type: String, required: true }, 
   // Se requiere un correo electrónico que es único
  email: { type: String, required: true, unique: true },
  // La fecha de creación se actualiza automaticamente
  createdAt: { type: Date, default: Date.now }, 
  // La fecha de actualización es igual a la de creación inicialmente
  updatedAt: { type: Date, default: Date.now }, 
});

// Con el esquema listo, creamos un modelo. Esto es lo que realmente usamos para trabajar con los datos en nuestra aplicación.
const User = mongoose.model<IUser>('User', UserSchema);

// Finalmente, hacemos que este modelo esté disponible en toda nuestra aplicación, exportándolo.
export default User;
