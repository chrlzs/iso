/**
 * @module TradingSystem
 * @description Manages trading interactions between players and merchants
 */

/**
 * @typedef {Object} TradeConfig
 * @property {InventorySystem} buyer - Buyer's inventory
 * @property {InventorySystem} seller - Seller's inventory
 * @property {Item} item - Item being traded
 * @property {number} quantity - Amount being traded
 * @property {number} price - Price per unit
 */

/**
 * @typedef {Object} MerchantConfig
 * @property {number} level - Merchant's trading level
 * @property {number} profitMargin - Base profit margin
 * @property {number} maxDiscount - Maximum possible discount
 * @property {Object} inventory - Initial inventory items
 */

/**
 * @typedef {Object} Item
 * @property {string} id - Unique item identifier
 * @property {string} name - Item name
 * @property {number} value - Base item value
 * @property {number} weight - Item weight
 * @property {boolean} isStackable - Whether item can stack
 * @property {string} [type] - Item type category
 * @property {string} [icon] - Item icon URL
 */

/**
 * Manages trading interactions and price calculations
 * @class TradingSystem
 * @property {number} profitMargin - Base profit margin for merchant sales
 * @property {number} maxDiscount - Maximum possible discount on purchases
 */
export class TradingSystem {
    /**
     * Creates a new TradingSystem instance
     * @param {Object} [config={}] - Trading configuration
     * @param {number} [config.profitMargin=0.2] - Merchant profit margin
     * @param {number} [config.maxDiscount=0.3] - Maximum possible discount
     */
    constructor(config = {}) {
        this.profitMargin = config.profitMargin || 0.2;
        this.maxDiscount = config.maxDiscount || 0.3;
    }

    /**
     * Calculates selling price for an item
     * @param {Item} item - Item being sold
     * @param {number} merchantLevel - Merchant's trading level
     * @returns {number} Calculated selling price
     */
    calculateSellingPrice(item, merchantLevel = 1) {
        const basePrice = item.value;
        const markup = this.profitMargin * (1 + (merchantLevel * 0.1));
        return Math.ceil(basePrice * (1 + markup));
    }

    /**
     * Calculates buying price for an item
     * @param {Item} item - Item being bought
     * @param {number} merchantLevel - Merchant's trading level
     * @returns {number} Calculated buying price
     */
    calculateBuyingPrice(item, merchantLevel = 1) {
        const basePrice = item.value;
        const discount = Math.min(this.maxDiscount, 0.1 + (merchantLevel * 0.05));
        return Math.floor(basePrice * (1 - discount));
    }

    /**
     * Executes a trade between two parties
     * @param {Object} trade - Trade configuration
     * @param {InventorySystem} trade.buyer - Buyer's inventory
     * @param {InventorySystem} trade.seller - Seller's inventory
     * @param {Item} trade.item - Item being traded
     * @param {number} trade.quantity - Quantity being traded
     * @param {number} trade.price - Agreed price per unit
     * @returns {boolean} True if trade was successful
     */
    executeTrade(trade) {
        const { buyer, seller, item, quantity, price } = trade;
        const totalCost = price * quantity;

        // Verify buyer has enough ETH
        if (buyer.eth < totalCost) {
            console.warn('Buyer has insufficient ETH');
            return false;
        }

        // Verify seller has item
        const sellerHasItem = seller.slots.some(slot => 
            slot && slot.id === item.id && slot.quantity >= quantity
        );
        if (!sellerHasItem) {
            console.warn('Seller does not have required item quantity');
            return false;
        }

        // Execute transaction
        try {
            // Transfer ETH
            buyer.eth -= totalCost;
            seller.eth += totalCost;

            // Transfer item
            seller.removeItem(item, quantity);
            buyer.addItem(item, quantity);

            return true;
        } catch (error) {
            console.error('Trade failed:', error);
            return false;
        }
    }

    /**
     * Validates a potential trade
     * @param {Object} trade - Trade configuration
     * @returns {boolean} True if trade is valid
     */
    validateTrade(trade) {
        const { buyer, seller, item, quantity, price } = trade;
        
        // Basic validation checks
        if (!buyer || !seller || !item || quantity <= 0 || price < 0) {
            return false;
        }

        // Check buyer's capacity
        const newWeight = buyer.getCurrentWeight() + (item.weight * quantity);
        if (newWeight > buyer.maxWeight) {
            return false;
        }

        // Check available slots
        const availableSlots = buyer.slots.filter(slot => slot === null).length;
        if (!item.isStackable && quantity > availableSlots) {
            return false;
        }

        return true;
    }
}
