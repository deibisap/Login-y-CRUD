//invocamos express

const express = require('express');
const app = express();

//2 seteamos urlencoded para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json()); 

//3 invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});


//4. el directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

// 5 establecer motor de plantillas
app.set('view engine', 'ejs');

//6 invocanos a bcryptjs
const bcryptjs = require('bcryptjs');

//7 Variable de session
const session = require('express-session');
app.use(session({
        secret:'secret',
        resave: true,
        saveUninitialized: true
}));
 

//8 invocar modulo de base de datos

const connection = require('./database/db');


// RUTAS


app.get ('/login',(req,res)=> {
    res.render('login');

})
 
app.get ('/register',(req,res)=> {
    res.render('register');

})

app.get ('/crear_cliente',(req,res)=> {
    res.render('crear_cliente');

})

app.get ('/lista_clientes',(req,res)=> {
    res.render('lista_clientes');

})

app.get ('/editar',(req,res)=> {
    res.render('editar');

})

// 10. registro (acá capturo los datos del formulario)

app.post('/register', async (req, res) => {
    const user= req.body.user;
    const name= req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    connection.query('INSERt INTO users SET ?' ,{user:user, name:name, rol:rol, pass:passwordHaash}, async (error, results)=>{

            if(error){
                console.log(error);
            }else{
                res.render('register', {
                    alert:true,
                    alertTitle: "Registro",
                    alertMessage: "!Te haz registrado correctamente!",
                    alertIcon: 'success',
                    showConfirmButton:false,
                    timer: 1500,
                    ruta:" "
                })
                 
            }
    })
       
});




// 11 AUTENTICACION
app.post('/auth', async(req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass,8);
    if(user && pass){

        connection.query ('SELECT * FROM users WHERE user = ?', [user], async(error, results) =>{
            if(results.length == 0 || ! (await bcryptjs.compare (pass, results[0].pass))){

                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "USUARIO y/o PASSWORD incorrectas",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'    
                }); 
            }else {

                req.session.loggedin = true;                
				req.session.name = results[0].name;
				res.render('login', {
					alert: true,
					alertTitle: "Conexión exitosa",
					alertMessage: "¡LOGIN CORRECTO!",
					alertIcon:'success',
					showConfirmButton: false,
					timer: 1500,
					ruta: ''
				});        	
                
            }

        } )

    } else {	
		res.send('Please enter user and Password!');
		res.end();
	}
   
});

//12 autenticacion de paginas

app.get('/', (req, res)=> {
	if (req.session.loggedin) {
		res.render('index',{
			login: true,
			name: req.session.name			
		});		
	} else {
		res.render('index',{
			login:false,
			name:'Debe iniciar sesión',			
		});				
	}
	res.end();
});


// limpiar cache

app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

//13 Logout

app.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
	})
});


// ruta crear clientes
app.post ("/crear_cliente", async(req,res)=>{

    const idcliente= req.body.idcliente;
    const nombre= req.body.nombre;
    const apellido = req.body.apellido;
    const telefono= req.body.telefono;
    const correo= req.body.correo;

    connection.query('INSERT INTO clientes SET ?', {idcliente:idcliente, nombre:nombre, apellido:apellido, telefono:telefono, correo:correo},
        async(error, results)=>{

            if(error){
                console.log(error);
            }else{
                res.render('crear_cliente', {
                    alert:true,
                    alertTitle: "Registro de clientes",
                    alertMessage: "!El registro del cliente ha sido exitoso!",
                    alertIcon: 'success',
                    showConfirmButton:false,
                    timer: 1500,
                    ruta:" "
                })
                 
            }
    })
       
});

// ruta listar clientes

app.get ("/clientes", async(req,res)=>{

   
    connection.query('SELECT * FROM clientes', async(error, results)=>{

            if(error){
                console.log(error);
            }else{
                res.render('clientes',{results:results});
            }
    })
       
});
//RUTA PARA EDITAR REGISTROS
app.get('editar/:idcliente', (req,res)=> {
    const idcliente= req.params.idcliente;
    connection.query('SELECT * FROM clientes WHEN idcliente=?', [idcliente], (error, results)=>{
        if(error){
            throw error;
        }else{
            res.render('editar', {user:results[0]})
        }
    } 
    )
}
)


app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
}) 