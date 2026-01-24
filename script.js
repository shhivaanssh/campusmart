// CampusMart product data (temporary frontend data)
const products = [
  {
    id: 1,
    name: "Engineering Mathematics Book",
    price: 350,
    category: "Books",
  },
  {
    id: 2,
    name: "Used Laptop",
    price: 25000,
    category: "Electronics",
  },
  {
    id: 3,
    name: "Study Table",
    price: 1800,
    category: "Furniture",
  },
];
// Select DOM elements
const exploreButton = document.getElementById("exploreBtn");
const productList = document.getElementById("productList");
function renderProducts() {
  productList.innerHTML = "";

  products.forEach((product) => {
    const productDiv = document.createElement("div");
    productDiv.className = "product-card";

    productDiv.innerHTML = `
      <h3>${product.name}</h3>
      <p>Category: ${product.category}</p>
      <p>Price: ₹${product.price}</p>
      <button class="secondary-btn">View Details</button>
    `;

    productList.appendChild(productDiv);
  });
}
exploreButton.addEventListener("click", function () {
  renderProducts();
});

