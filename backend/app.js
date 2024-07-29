const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('view engine', 'ejs');

// Database connection
const db = mysql.createConnection({
  //host: 'localhost',
  //user: 'root',
  //password: '',
  //database: 'eco_shop'
  host: 'sql.freeb.tech',
  user: 'freedb_Brian' ,
  password: 'E$pv786CEgzV38r', 
  database: 'freedb_eco_shop',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL Database.');
});

// Session setup
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

// Route to display products
app.get('/', (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, result) => {
    if (err) throw err;
    res.render('index', { products: result });
  });
});

// Route to add product to cart
app.post('/cart/add', (req, res) => {
  const { productId } = req.body;
  const cart = req.session.cart || [];

  const existingProductIndex = cart.findIndex(item => item.productId === productId);

  if (existingProductIndex !== -1) {
    cart[existingProductIndex].quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  req.session.cart = cart;
  res.redirect('/cart');
});

// Route to view cart
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.render('cart', { cartItems: [] });
  }

  const productIds = cart.map(item => item.productId);
  const query = 'SELECT * FROM products WHERE id IN (?)';

  db.query(query, [productIds], (err, products) => {
    if (err) throw err;

    const cartItems = cart.map(item => {
      const product = products.find(p => p.id == item.productId);
      return {
        ...product,
        quantity: item.quantity
      };
    });

    res.render('cart', { cartItems });
  });
});

// Route to checkout
app.get('/checkout', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.render('checkout', { cartItems: [] });
  }

  const productIds = cart.map(item => item.productId);
  const query = 'SELECT * FROM products WHERE id IN (?)';

  db.query(query, [productIds], (err, products) => {
    if (err) throw err;

    const cartItems = cart.map(item => {
      const product = products.find(p => p.id == item.productId);
      return {
        ...product,
        quantity: item.quantity
      };
    });

    res.render('checkout', { cartItems });
  });
});

// Route to confirm checkout
app.get('/checkout/confirm', (req, res) => {
  req.session.cart = [];
  res.render('confirmation');
});

// Admin login route
app.get('/admin/login', (req, res) => {
  res.render('admin_login');
});

// Admin login POST route
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'adminpassword') {
    req.session.admin = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login');
  }
});

// Admin route
app.get('/admin', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const query = 'SELECT * FROM products';
  db.query(query, (err, result) => {
    if (err) throw err;
    res.render('admin', { products: result });
  });
});

// Admin add product route
app.get('/admin/add', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }
  res.render('admin_add');
});

app.post('/admin/add', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const { name, description, price, image, quantity } = req.body;
  const query = 'INSERT INTO products (name, description, price, image, quantity) VALUES (?, ?, ?, ?, ?)';

  db.query(query, [name, description, price, image, quantity], (err) => {
    if (err) throw err;
    res.redirect('/admin');
  });
});

// Admin edit product route
app.get('/admin/edit/:id', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const query = 'SELECT * FROM products WHERE id = ?';
  db.query(query, [req.params.id], (err, result) => {
    if (err) throw err;
    res.render('admin_edit', { product: result[0] });
  });
});

app.post('/admin/edit/:id', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const { name, description, price, image, quantity } = req.body;
  const query = 'UPDATE products SET name = ?, description = ?, price = ?, image = ?, quantity = ? WHERE id = ?';

  db.query(query, [name, description, price, image, quantity, req.params.id], (err) => {
    if (err) throw err;
    res.redirect('/admin');
  });
});

// Admin delete product route
app.get('/admin/delete/:id', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const query = 'DELETE FROM products WHERE id = ?';
  db.query(query, [req.params.id], (err) => {
    if (err) throw err;
    res.redirect('/admin');
  });
});

app.listen(3306, () => {
  console.log('Server is running on port 3306');
});
