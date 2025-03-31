# Trading System Documentation

## Overview
The trading system enables player-merchant interactions in a cyberpunk-themed virtual marketplace. It supports buying, selling, and price negotiations based on merchant levels and relationship factors.

## Key Components

### Merchant Class
- Base merchant NPC with trading capabilities
- Maintains personal inventory and ETH balance
- Dynamic pricing based on level and profit margins
- Visual representation with cyberpunk aesthetics

### Trading Mechanics
1. **Price Calculation**
   - Base item value
   - Merchant level modifier
   - Profit margin (selling)
   - Discount rate (buying)

2. **Trading Operations**
   - Buy from merchant
   - Sell to merchant
   - Item quantity management
   - ETH currency exchange

### Merchant UI
- Split view showing merchant and player inventories
- Real-time price calculations
- ETH balance displays
- Quantity selection for bulk trades

## Implementation Details

### Price Formulas
```javascript
Selling Price = basePrice * (1 + markup)
where markup = profitMargin * (1 + (merchantLevel * 0.1))

Buying Price = basePrice * (1 - discount)
where discount = min(0.3, 0.1 + (merchantLevel * 0.05))
```

### Usage Example
```javascript
// Initiate trade with merchant
player.interact(merchant);

// Buy item from merchant
merchant.sellToPlayer(itemSlot, quantity, player);

// Sell item to merchant
merchant.buyFromPlayer(itemSlot, quantity, player);
```

## Debug Commands
Available in development mode:
- `/spawnmerchant` - Creates a test merchant
- `/setmerchantlevel <level>` - Adjusts merchant level
- `/setmerchanteth <amount>` - Sets merchant ETH balance

## Future Enhancements
- Reputation system affecting prices
- Trade quests and special deals
- Black market merchants
- Item rarity affecting prices
