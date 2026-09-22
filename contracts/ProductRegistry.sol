// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProductRegistry {
    struct Product {
        string productId;
        string name;
        string brand;
        string manufacturer;
        string category;
        string batchNumber;
        string manufacturingDate;
        string expiryDate;
        uint256 registeredAt;
        address registeredBy;
        bool active;
    }

    mapping(string => Product) private products;
    string[] private productIds;

    event ProductRegistered(
        string indexed productId,
        string name,
        string brand,
        address indexed registeredBy,
        uint256 registeredAt
    );

    event ProductRevoked(
        string indexed productId,
        address indexed revokedBy,
        uint256 revokedAt
    );

    function registerProduct(
        string memory _productId,
        string memory _name,
        string memory _brand,
        string memory _manufacturer,
        string memory _category,
        string memory _batchNumber,
        string memory _manufacturingDate,
        string memory _expiryDate
    ) public {
        require(bytes(_productId).length > 0, "Product ID required");
        require(products[_productId].registeredAt == 0, "Product already exists");

        products[_productId] = Product({
            productId: _productId,
            name: _name,
            brand: _brand,
            manufacturer: _manufacturer,
            category: _category,
            batchNumber: _batchNumber,
            manufacturingDate: _manufacturingDate,
            expiryDate: _expiryDate,
            registeredAt: block.timestamp,
            registeredBy: msg.sender,
            active: true
        });

        productIds.push(_productId);

        emit ProductRegistered(
            _productId,
            _name,
            _brand,
            msg.sender,
            block.timestamp
        );
    }

    function revokeProduct(string memory _productId) public {
        require(products[_productId].registeredAt != 0, "Product not found");
        products[_productId].active = false;

        emit ProductRevoked(_productId, msg.sender, block.timestamp);
    }

    function getProduct(string memory _productId)
        public
        view
        returns (Product memory)
    {
        return products[_productId];
    }

    function productExists(string memory _productId) public view returns (bool) {
        return products[_productId].registeredAt != 0;
    }

    function getProductIds() public view returns (string[] memory) {
        return productIds;
    }
}
