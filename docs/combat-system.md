# Combat System Documentation

## Overview
The combat system provides real-time cyberpunk-themed combat mechanics, integrating with equipment, status effects, and energy systems.

## Core Components

### Damage Types
- Physical: Standard weapon damage
- Energy: Tech-based attacks
- EMP: Anti-cybernetic damage
- Neural: Mind/hack damage

### Combat Mechanics
1. **Attack Calculation**
```javascript
finalDamage = (baseDamage + weaponDamage) * 
              (1 + criticalMultiplier) * 
              (1 - targetResistance)
```

2. **Defense Calculation**
```javascript
damageReduction = baseArmor + 
                  equipmentBonus + 
                  (energyShield * shieldEfficiency)
```

### Hit Determination
- Base hit chance: 80%
- Modified by:
  - Attacker's accuracy
  - Target's evasion
  - Environmental factors
  - Status effects

## Combat States
1. **Normal**
   - Standard movement/attack
   - Full energy regeneration

2. **Combat**
   - Reduced energy regen
   - Combat-specific abilities
   - Threat tracking

3. **Stealth**
   - Sneak attack bonuses
   - Reduced detection
   - Special abilities

## Status Effects
- Stunned: Cannot act
- Hacked: Reduced abilities
- EMP'd: Tech disabled
- Overcharged: Bonus damage/risk

## Integration Points
- InventorySystem: Weapon/armor stats
- EnergySystem: Ability costs
- UISystem: Combat feedback
- AnimationSystem: Combat visuals

## Debug Commands
```javascript
/godmode         // Toggle invulnerability
/sethitchance 90 // Modify hit probability
/damage 50       // Deal direct damage
/heal 50         // Heal amount
```

## Example Usage
```javascript
// Basic attack
combatSystem.processAttack(attacker, defender, {
    weaponType: 'energy',
    damageType: 'neural',
    criticalChance: 0.15
});

// Special ability
combatSystem.useAbility(player, 'emp_blast', {
    range: 3,
    duration: 5000,
    energyCost: 25
});
```

## Future Enhancements
- Combo system
- Team-based tactics
- Environmental hazards
- Advanced AI behaviors
- Neural hacking mechanics
