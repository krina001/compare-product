class CompareProduct {
  constructor() {
    this.storageKey = "m-compare-products";
    this.products = [];
    this.productNodes = {};

    this.pageTemplate = "page.product-compare";
    this.addedClass = "added-to-compare";
    this.selectors = {
      container: ".m-compare-page-content__wrapper",
      noProducts: ".m-compare-no-products",
      wrapper: ".m-compare-card",
      item: ".m-product-card",
      compareButton: ".m-compare-button",
      compareText: ".m-compare-button-text",
      removeButton: ".m-compare-remove-button",
      count: ".m-compare-count",
      // Add for compare modal
      clearAllButton: ".m-compare-clear-all-button",
      modal: "#compareModal",
      compareImagesContainer: "#compareImagesContainer",
    };
    this.products = Array.from(
      new Set(
        Array.from(JSON.parse(localStorage.getItem(this.storageKey)) || [])
      )
    );
    this.isComparePage = MinimogSettings.template === this.pageTemplate;
    this.init();
  }

  init() {
    if (this.isComparePage) {
      this.renderComparePage();
      this.addEventToRemoveButtons();
    }

    this.setCompareButtonsState();
    this.addEventToCompareButtons();
    this.addEventToClearAllButton(); // Add this line for compare modal
    this.updateCompareCount();
  }

  saveToStorage() {
    this.products = Array.from(new Set(this.products));
    localStorage.setItem(this.storageKey, JSON.stringify(this.products));
  }

  addToCompare(handle) {
    if (handle && this.products.indexOf(handle) === -1) {
      this.products.push(handle);
      this.saveToStorage();
      this.addProductImageToModal(handle); // Add this line for compare modal
      this.updateCompareCount();
    }
  }

  removeFromCompare(handle) {
    this.products = this.products.filter((hdl) => hdl !== handle);
    this.saveToStorage();
    this.updateCompareCount();
    this.removeProductImage(handle);
    if (!this.products.length) {
    this.showNoProductsMessage();
  }
  }

  setCompareButtonsState() {
    const buttons = document.querySelectorAll(this.selectors.compareButton);
    buttons.forEach((btn) => {
      const prodHandle = btn?.dataset.productHandle;
      if (
        this.products.indexOf(prodHandle) >= 0 &&
        btn &&
        !btn.classList.contains(this.addedClass)
      ) {
        this.toggleButtonState(btn, true);
      }
    });
  }

  updateCompareCount() {
    const size = this.products.length;
    const countElems = document.querySelectorAll(this.selectors.count);
    [...countElems].forEach((elem) => {
      elem.textContent = size;

      if (size < 1) {
        elem.classList.add("m:hidden"); // Hide count element if no products
      } else {
        elem.classList.remove("m:hidden"); // Show count element if products exist
      }
    });
  }

  addEventToCompareButtons() {
    addEventDelegate({
      selector: this.selectors.compareButton,
      handler: async (e, btn) => {
        e.preventDefault(); // Ensure default action is prevented
        // console.log('Compare button clicked');

        const productHandle = btn?.dataset.productHandle;
        if (productHandle) {
          const active = !btn.classList.contains(this.addedClass);
          this.toggleButtonState(btn, active);
          this.updateCompareCount();

          if (active) {
            // console.log('Adding product to modal:', productHandle);
            await this.addProductImageToModal(productHandle); // Wait for the image to be added
          }

          // console.log('Opening modal');
          this.openModal(); // This should only happen once
        }
      },
    });
  }

  async addProductImageToModal(productHandle) {
    const productImageUrl = await this.getProductImageUrl(productHandle);
    const deleteIconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path d="M 20.5 4 A 1.50015 1.50015 0 0 0 19.066406 6 L 14.640625 6 C 12.803372 6 11.082924 6.9194511 10.064453 8.4492188 L 7.6972656 12 L 7.5 12 A 1.50015 1.50015 0 1 0 7.5 15 L 8.2636719 15 A 1.50015 1.50015 0 0 0 8.6523438 15.007812 L 11.125 38.085938 C 11.423352 40.868277 13.795836 43 16.59375 43 L 31.404297 43 C 34.202211 43 36.574695 40.868277 36.873047 38.085938 L 39.347656 15.007812 A 1.50015 1.50015 0 0 0 39.728516 15 L 40.5 15 A 1.50015 1.50015 0 1 0 40.5 12 L 40.302734 12 L 37.935547 8.4492188 C 36.916254 6.9202798 35.196001 6 33.359375 6 L 28.933594 6 A 1.50015 1.50015 0 0 0 27.5 4 L 20.5 4 z M 14.640625 9 L 33.359375 9 C 34.196749 9 34.974746 9.4162203 35.439453 10.113281 L 36.697266 12 L 11.302734 12 L 12.560547 10.113281 A 1.50015 1.50015 0 0 0 12.5625 10.111328 C 13.025982 9.4151428 13.801878 9 14.640625 9 z M 11.669922 15 L 36.330078 15 L 33.890625 37.765625 C 33.752977 39.049286 32.694383 40 31.404297 40 L 16.59375 40 C 15.303664 40 14.247023 39.049286 14.109375 37.765625 L 11.669922 15 z"/>
    </svg>
  `;

    if (productImageUrl) {
      // Create container for image and delete icon
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("compare-image-container");

      // Create the image element
      const img = document.createElement("img");
      img.src = productImageUrl;
      img.alt = productHandle;
      img.setAttribute("data-product-handle", productHandle);

      // Create the delete icon element
      const deleteIcon = document.createElement("span");
      deleteIcon.classList.add("compare-delete-icon");
      deleteIcon.innerHTML = deleteIconSVG;

      // Append image and delete icon to the container
      imageContainer.appendChild(img);
      imageContainer.appendChild(deleteIcon);

      // Append the container to the modal
      const compareImagesContainer = document.getElementById(
        "compareImagesContainer"
      );
      if (compareImagesContainer) {
        // Check if the image already exists
        const existingImg = compareImagesContainer.querySelector(
          `img[data-product-handle="${productHandle}"]`
        );
        if (!existingImg) {
          compareImagesContainer.appendChild(imageContainer);
        }
      } else {
        console.error("Compare images container not found.");
      }

      // Add event listener for delete icon
      deleteIcon.addEventListener("click", () =>
        this.removeProductImage(productHandle)
      );
    } else {
      console.error("Product image URL not found");
    }
  }

  async getProductImageUrl(productHandle) {
    try {
      const response = await fetch(`/products/${productHandle}.json`);
      const data = await response.json();
      return data.product.images[0].src; // Assuming you want the first image
    } catch (error) {
      console.error("Error fetching product image:", error);
      return "";
    }
  }

  removeProductImage(productHandle) {
    // Find all images in the modal that match the product handle and remove them
    const images = document.querySelectorAll(
      `${this.selectors.compareImagesContainer} .compare-image-container img[data-product-handle="${productHandle}"]`
    );

    if (images.length > 0) {
      images.forEach((img) => img.closest(".compare-image-container").remove());

      // Remove the product handle from the compare list
      this.removeFromCompare(productHandle);

      // Update the compare count
      this.updateCompareCount();
    }

    // Update compare buttons state if needed
    const compareButtons = document.querySelectorAll(
      this.selectors.compareButton
    );
    compareButtons.forEach((btn) => {
      if (btn.dataset.productHandle === productHandle) {
        btn.classList.remove(this.addedClass);
      }
    });
  }

  toggleButtonState(btn, active) {
    const productHandle = btn?.dataset.productHandle;
    const compareText = btn?.querySelector(this.selectors.compareText);

    if (active) {
      this.addToCompare(productHandle);
      btn.classList.add(this.addedClass);
    } else {
      this.removeFromCompare(productHandle); // Now also removes from the modal
      btn.classList.remove(this.addedClass);
    }

    if (compareText) {
      const temp = compareText.dataset.revertText;
      compareText.dataset.revertText = compareText.textContent;
      compareText.textContent = temp;
    }
  }

  addEventToRemoveButtons() {
    addEventDelegate({
      selector: this.selectors.removeButton,
      handler: (e, btn) => {
        e.preventDefault();
        const prod = btn?.closest(this.selectors.wrapper);
        prod?.remove();

        const productHandle = btn && btn.dataset.productHandle;
        if (productHandle) {
          this.removeFromCompare(productHandle);
          this.updateCompareCount();
         if (!this.products.length) {
            this.showNoProductsMessage();
          }
        }
      },
    });
  }

  renderComparePage = async () => {
    const container = document.querySelector(this.selectors.container);
    if (container) {
      let noItemAvailable = true;

      if (this.products.length) {
        const promises = this.products.map(async (hdl) => {
          const prodHTML = await fetchCache(`/products/${hdl}?view=compare`);
          const item = document.createElement("DIV");
          // console.log(prodHTML);
          item.classList.add("m:hidden", "m:column", "m-compare-card");
          item.innerHTML = prodHTML;
          if (item.querySelector(this.selectors.item)) {
            noItemAvailable = false;
            this.productNodes[hdl] = item;
          }
        });

        await Promise.all(promises);

        // Render in order
        this.products.forEach((hdl) => {
          const prodNode = this.productNodes[hdl];
          if (prodNode) {
            container.appendChild(prodNode);
            prodNode.classList.remove("m:hidden");
          }
        });
      }
      if (noItemAvailable) {
        this.showNoProductsMessage();
      }
      container.classList.add("is-visible");
    }
  };

  openModal() {
    const modal = document.getElementById("compareModal");
    if (modal) {
      modal.style.display = "block";
      modal.style.opacity = 1;
      this.renderAllProductImages();
    }
  }

  closeModal() {
    const modal = document.getElementById("compareModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  renderAllProductImages() {
    const compareImagesContainer = document.getElementById(
      "compareImagesContainer"
    );
    if (compareImagesContainer) {
      // Loop through products but only add those not already in the modal
      this.products.forEach(async (productHandle) => {
        const existingImg = compareImagesContainer.querySelector(
          `img[data-product-handle="${productHandle}"]`
        );
        if (!existingImg) {
          await this.addProductImageToModal(productHandle);
        }
      });
    }
  }

  clearAllProducts() {
    // Remove all product images from the compare modal
    const compareImagesContainer = document.getElementById(
      "compareImagesContainer"
    );
    if (compareImagesContainer) {
      compareImagesContainer.innerHTML = ""; // Clear all images
    }

    // Clear products from the compare list
    this.products = [];
    localStorage.removeItem(this.storageKey);
    this.updateCompareCount();

    const container = document.querySelector(this.selectors.container);
    if (container) {
      container.innerHTML = ""; // Clear all product nodes
    }
    const compareButtons = document.querySelectorAll(
      this.selectors.compareButton
    );
    compareButtons.forEach((btn) => {
      btn.classList.remove(this.addedClass);
    });
  }

  addEventToClearAllButton() {
    const clearAllButton = document.querySelector(
      this.selectors.clearAllButton
    );
    if (clearAllButton) {
      clearAllButton.addEventListener("click", () => this.clearAllProducts());
    }
  }
  
  showNoProductsMessage() {
    const container = document.querySelector(this.selectors.container);
    const noProducts = document.querySelector(this.selectors.noProducts);

    container.classList.add('m:hidden');
    noProducts.classList.remove('m:hidden');
  }
}

MinimogTheme.CompareProduct = new CompareProduct();

document.querySelector(".compare-close").addEventListener("click", function () {
  MinimogTheme.CompareProduct.closeModal();
});

window.addEventListener("click", function (event) {
  const modal = document.getElementById("compareModal");
  if (event.target === modal) {
    MinimogTheme.CompareProduct.closeModal();
  }
});
