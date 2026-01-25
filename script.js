// ===== APPLICATION STATE =====
const state = {
  products: [
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
    {
      id: 4,
      name: "Data Structures Book",
      price: 400,
      category: "Books",
    },
  ],
  selectedCategory: "All",
  searchText: "",
};

// ===== DOM ELEMENTS =====
const productList = document.getElementById("productList");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");

function getFilteredProducts() {
  return state.products
    .filter((product) => {
      if (state.selectedCategory === "All") return true;
      return product.category === state.selectedCategory;
    })
    .filter((product) =>
      product.name.toLowerCase().includes(state.searchText.toLowerCase())
    );
}
function renderProducts() {
  productList.innerHTML = "";

  const filteredProducts = getFilteredProducts();

  if (filteredProducts.length === 0) {
    productList.innerHTML = "<p>No products found.</p>";
    return;
  }

  filteredProducts.forEach((product) => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <h3>${product.name}</h3>
      <p>Category: ${product.category}</p>
      <p>Price: ₹${product.price}</p>
      <button class="secondary-btn">View Details</button>
    `;

    productList.appendChild(div);
  });
}
categoryFilter.addEventListener("change", (e) => {
  state.selectedCategory = e.target.value;
  renderProducts();
});

searchInput.addEventListener("input", (e) => {
  state.searchText = e.target.value;
  renderProducts();
});
renderProducts();
