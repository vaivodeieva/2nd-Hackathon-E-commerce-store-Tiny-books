
(function ($) {

  "use strict";

  let OptionManager = (function () {
    let objToReturn = {};

    let _options = null;
    let DEFAULT_OPTIONS = {
      currencySymbol: '$',
      classCartIcon: 'my-cart-icon',
      classCartBadge: 'my-cart-badge',
      classProductQuantity: 'my-product-quantity',
      classProductRemove: 'my-product-remove',
      classCheckoutCart: 'my-cart-checkout',
      affixCartIcon: true,
      showCheckoutModal: true,
      numberOfDecimals: 2,
      cartItems: null,
      clickOnAddToCart: function ($addTocart) {},
      afterAddOnCart: function (products, totalPrice, totalQuantity) {},
      clickOnCartIcon: function ($cartIcon, products, totalPrice, totalQuantity) {},
      checkoutCart: function (products, totalPrice, totalQuantity) {
        return false;
      },
      getDiscountPrice: function (products, totalPrice, totalQuantity) {
        return null;
      }
    };


    let loadOptions = function (customOptions) {
      _options = $.extend({}, DEFAULT_OPTIONS);
      if (typeof customOptions === 'object') {
        $.extend(_options, customOptions);
      }
    };
    let getOptions = function () {
      return _options;
    };

    objToReturn.loadOptions = loadOptions;
    objToReturn.getOptions = getOptions;
    return objToReturn;
  }());

  let MathHelper = (function () {
    let objToReturn = {};
    let getRoundedNumber = function (number) {
      if (isNaN(number)) {
        throw new Error('Parameter is not a Number');
      }
      number = number * 1;
     let options = OptionManager.getOptions();
      return number.toFixed(options.numberOfDecimals);
    };
    objToReturn.getRoundedNumber = getRoundedNumber;
    return objToReturn;
  }());

  let ProductManager = (function () {
    let objToReturn = {};

    /*
    PRIVATE
    */
    const STORAGE_NAME = "__mycart";
    localStorage[STORAGE_NAME] = localStorage[STORAGE_NAME] ? localStorage[STORAGE_NAME] : "";
    let getIndexOfProduct = function (id) {
      let productIndex = -1;
      let products = getAllProducts();
      $.each(products, function (index, value) {
        if (value.id == id) {
          productIndex = index;
          return;
        }
      });
      return productIndex;
    };
    let setAllProducts = function (products) {
      localStorage[STORAGE_NAME] = JSON.stringify(products);
    };
    let addProduct = function (id, name, summary, price, quantity, image) {
      let products = getAllProducts();
      products.push({
        id: id,
        name: name,
        summary: summary,
        price: price,
        quantity: quantity,
        image: image
      });
      setAllProducts(products);
    };

    /*
    PUBLIC
    */
    let getAllProducts = function () {
      try {
        let products = JSON.parse(localStorage[STORAGE_NAME]);
        return products;
      } catch (e) {
        return [];
      }
    };
    let updatePoduct = function (id, quantity, increaseQuantity) {
      let productIndex = getIndexOfProduct(id);
      if (productIndex < 0) {
        return false;
      }
      let products = getAllProducts();
      if(increaseQuantity) {
        products[productIndex].quantity = products[productIndex].quantity * 1 + (typeof quantity === "undefined" ? 1 : quantity * 1);
      } else {
        products[productIndex].quantity = typeof quantity === "undefined" ? products[productIndex].quantity * 1 + 1 : quantity * 1;
      }
      setAllProducts(products);
      return true;
    };
    let setProduct = function (id, name, summary, price, quantity, image) {
      if (typeof id === "undefined") {
        console.error("id required");
        return false;
      }
      if (typeof name === "undefined") {
        console.error("name required");
        return false;
      }
      if (typeof image === "undefined") {
        console.error("image required");
        return false;
      }
      if (!$.isNumeric(price)) {
        console.error("price is not a number");
        return false;
      }
      if (!$.isNumeric(quantity)) {
        console.error("quantity is not a number");
        return false;
      }
      summary = typeof summary === "undefined" ? "" : summary;

      if (!updatePoduct(id, quantity, true)) {
        addProduct(id, name, summary, price, quantity, image);
      }
    };
    let clearProduct = function () {
      setAllProducts([]);
    };
    let removeProduct = function (id) {
      let products = getAllProducts();
      products = $.grep(products, function (value, index) {
        return value.id != id;
      });
      setAllProducts(products);
    };
    let getTotalQuantity = function () {
      let total = 0;
      let products = getAllProducts();
      $.each(products, function (index, value) {
        total += value.quantity * 1;
      });
      return total;
    };
    let getTotalPrice = function () {
      let products = getAllProducts();
      let total = 0;
      $.each(products, function (index, value) {
        total += value.quantity * value.price;
        total = MathHelper.getRoundedNumber(total) * 1;
      });
      return total;
    };

    objToReturn.getAllProducts = getAllProducts;
    objToReturn.updatePoduct = updatePoduct;
    objToReturn.setProduct = setProduct;
    objToReturn.clearProduct = clearProduct;
    objToReturn.removeProduct = removeProduct;
    objToReturn.getTotalQuantity = getTotalQuantity;
    objToReturn.getTotalPrice = getTotalPrice;
    return objToReturn;
  }());


  let loadMyCartEvent = function (targetSelector) {

    let options = OptionManager.getOptions();
    let $cartIcon = $("." + options.classCartIcon);
    let $cartBadge = $("." + options.classCartBadge);
    let classProductQuantity = options.classProductQuantity;
    let classProductRemove = options.classProductRemove;
    let classCheckoutCart = options.classCheckoutCart;

    let idCartModal = 'my-cart-modal';
    let idCartTable = 'my-cart-table';
    let idGrandTotal = 'my-cart-grand-total';
    let idEmptyCartMessage = 'my-cart-empty-message';
    let idDiscountPrice = 'my-cart-discount-price';
    let classProductTotal = 'my-product-total';
    let classAffixMyCartIcon = 'my-cart-icon-affix';


    if (options.cartItems && options.cartItems.constructor === Array) {
      ProductManager.clearProduct();
      $.each(options.cartItems, function () {
        ProductManager.setProduct(this.id, this.name, this.summary, this.price, this.quantity, this.image);
      });
    }

    $cartBadge.text(ProductManager.getTotalQuantity());

    if (!$("#" + idCartModal).length) {
      $('body').append(
        '<div class="modal fade" id="' + idCartModal + '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" id="myModalLabel"><span class="glyphicon glyphicon-shopping-cart"></span> My Cart</h4>' +
        '</div>' +
        '<div class="modal-body">' +
        '<table class="table table-hover table-responsive" id="' + idCartTable + '"></table>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        '<button type="button" class="btn btn-primary ' + classCheckoutCart + '">Checkout</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
      );
    }

    let drawTable = function () {
      let $cartTable = $("#" + idCartTable);
      $cartTable.empty();

      let products = ProductManager.getAllProducts();
      $.each(products, function () {
        let total = this.quantity * this.price;
        $cartTable.append(
          '<tr title="' + this.summary + '" data-id="' + this.id + '" data-price="' + this.price + '">' +
          '<td class="text-center" style="width: 30px;"><img width="30px" height="30px" src="' + this.image + '"/></td>' +
          '<td>' + this.name + '</td>' +
          '<td title="Unit Price" class="text-right">' + options.currencySymbol + MathHelper.getRoundedNumber(this.price) + '</td>' +
          '<td title="Quantity"><input type="number" min="1" style="width: 70px;" class="' + classProductQuantity + '" value="' + this.quantity + '"/></td>' +
          '<td title="Total" class="text-right ' + classProductTotal + '">' + options.currencySymbol + MathHelper.getRoundedNumber(total) + '</td>' +
          '<td title="Remove from Cart" class="text-center" style="width: 30px;"><a href="javascript:void(0);" class="btn btn-xs btn-danger ' + classProductRemove + '">X</a></td>' +
          '</tr>'
        );
      });

      $cartTable.append(products.length ?
        '<tr>' +
        '<td></td>' +
        '<td><strong>Total</strong></td>' +
        '<td></td>' +
        '<td></td>' +
        '<td class="text-right"><strong id="' + idGrandTotal + '"></strong></td>' +
        '<td></td>' +
        '</tr>' :
        '<div class="alert alert-danger" role="alert" id="' + idEmptyCartMessage + '">Your cart is empty</div>'
      );

      let discountPrice = options.getDiscountPrice(products, ProductManager.getTotalPrice(), ProductManager.getTotalQuantity());
      if (products.length && discountPrice !== null) {
        $cartTable.append(
          '<tr style="color: red">' +
          '<td></td>' +
          '<td><strong>Total (including discount)</strong></td>' +
          '<td></td>' +
          '<td></td>' +
          '<td class="text-right"><strong id="' + idDiscountPrice + '"></strong></td>' +
          '<td></td>' +
          '</tr>'
        );
      }

      showGrandTotal();
      showDiscountPrice();
    };
    let showModal = function () {
      drawTable();
      $("#" + idCartModal).modal('show');
    };
    let updateCart = function () {
      $.each($("." + classProductQuantity), function () {
        let id = $(this).closest("tr").data("id");
        ProductManager.updatePoduct(id, $(this).val());
      });
    };
    let showGrandTotal = function () {
      $("#" + idGrandTotal).text(options.currencySymbol + MathHelper.getRoundedNumber(ProductManager.getTotalPrice()));
    };
    let showDiscountPrice = function () {
      $("#" + idDiscountPrice).text(options.currencySymbol + MathHelper.getRoundedNumber(options.getDiscountPrice(ProductManager.getAllProducts(), ProductManager.getTotalPrice(), ProductManager.getTotalQuantity())));
    };

    /*
    EVENT
    */
    if (options.affixCartIcon) {
      let cartIconBottom = $cartIcon.offset().top * 1 + $cartIcon.css("height").match(/\d+/) * 1;
      let cartIconPosition = $cartIcon.css('position');
      $(window).scroll(function () {
        $(window).scrollTop() >= cartIconBottom ? $cartIcon.addClass(classAffixMyCartIcon) : $cartIcon.removeClass(classAffixMyCartIcon);
      });
    }

    $cartIcon.click(function () {
      options.showCheckoutModal ? showModal() : options.clickOnCartIcon($cartIcon, ProductManager.getAllProducts(), ProductManager.getTotalPrice(), ProductManager.getTotalQuantity());
    });

    $(document).on("input", "." + classProductQuantity, function () {
      let price = $(this).closest("tr").data("price");
      let id = $(this).closest("tr").data("id");
      let quantity = $(this).val();

      $(this).parent("td").next("." + classProductTotal).text(options.currencySymbol + MathHelper.getRoundedNumber(price * quantity));
      ProductManager.updatePoduct(id, quantity);

      $cartBadge.text(ProductManager.getTotalQuantity());
      showGrandTotal();
      showDiscountPrice();
    });

    $(document).on('keypress', "." + classProductQuantity, function (evt) {
      if (evt.keyCode >= 48 && evt.keyCode <= 57) {
        return;
      }
      evt.preventDefault();
    });

    $(document).on('click', "." + classProductRemove, function () {
      let $tr = $(this).closest("tr");
      let id = $tr.data("id");
      $tr.hide(500, function () {
        ProductManager.removeProduct(id);
        drawTable();
        $cartBadge.text(ProductManager.getTotalQuantity());
      });
    });

    $(document).on('click', "." + classCheckoutCart, function () {
      let products = ProductManager.getAllProducts();
      if (!products.length) {
        $("#" + idEmptyCartMessage).fadeTo('fast', 0.5).fadeTo('fast', 1.0);
        return;
      }
      updateCart();
      let isCheckedOut = options.checkoutCart(ProductManager.getAllProducts(), ProductManager.getTotalPrice(), ProductManager.getTotalQuantity());
      if (isCheckedOut !== false) {
        ProductManager.clearProduct();
        $cartBadge.text(ProductManager.getTotalQuantity());
        $("#" + idCartModal).modal("hide");
      }
    });

    $(document).on('click', targetSelector, function () {
      let $target = $(this);
      options.clickOnAddToCart($target);

      let id = $target.data('id');
      let name = $target.data('name');
      let summary = $target.data('summary');
      let price = $target.data('price');
      let quantity = $target.data('quantity');
      let image = $target.data('image');

      ProductManager.setProduct(id, name, summary, price, quantity, image);
      $cartBadge.text(ProductManager.getTotalQuantity());

      options.afterAddOnCart(ProductManager.getAllProducts(), ProductManager.getTotalPrice(), ProductManager.getTotalQuantity());
    });

  };


  $.fn.myCart = function (userOptions) {
    OptionManager.loadOptions(userOptions);
    loadMyCartEvent(this.selector);
    return this;
  };


})(jQuery);