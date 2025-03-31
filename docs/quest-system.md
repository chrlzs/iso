# Quest System Documentation

## Overview
The quest system provides a framework for creating, managing, and tracking player missions and objectives in a cyberpunk setting. It integrates with the notification system, UI components, and reward mechanisms.

## Core Components

### QuestSystem Class
- Central manager for all quest-related operations
- Tracks active and completed quests
- Handles quest progression and rewards
- Integrates with UI components

### Quest Structure
```javascript
{
    id: 'unique-quest-id',
    title: 'Quest Title',
    description: 'Quest Description',
    objectives: [
        {
            id: 'objective-1',
            description: 'Objective description',
            required: 1,
            progress: 0,
            completed: false
        }
    ],
    rewards: {
        eth: 100,
        items: [{id: 'item-1', quantity: 1}],
        experience: 500
    },
    status: 'active' | 'completed' | 'failed'
}
```

### Quest Types
1. **Collection Quests**
   - Gather specific items
   - Track item quantities
   - Validate inventory contents

2. **Interaction Quests**
   - Speak with NPCs
   - Visit locations
   - Complete transactions

3. **Combat Quests**
   - Defeat specific enemies
   - Survive encounters
   - Protect objectives

## Implementation Guide

### Creating a New Quest
```javascript
const questConfig = {
    id: 'merchant-quest-1',
    title: 'Digital Dealings',
    description: 'Help the merchant establish their network',
    objectives: [
        {
            id: 'trade-eth',
            description: 'Complete 3 trades',
            required: 3,
            progress: 0
        }
    ],
    rewards: {
        eth: 500,
        experience: 1000
    }
};

questSystem.startQuest(questConfig);
```

### Quest Progress Updates
```javascript
// Update quest progress
questSystem.updateQuestProgress('merchant-quest-1', 1);

// Check completion
if (quest.progress >= quest.objectives.total) {
    questSystem.completeQuest('merchant-quest-1');
}
```

## UI Integration
- QuestLogUI displays active quests
- NotificationSystem shows updates
- StatusUI tracks objectives

## Quest States
1. **Inactive**: Not yet available
2. **Active**: Currently in progress
3. **Completed**: Successfully finished
4. **Failed**: Failed conditions

## Debug Tools
- `/listquests` - Shows all quests
- `/completequest <id>` - Force completes quest
- `/resetquest <id>` - Resets quest progress

## Future Enhancements
- Branching quest lines
- Time-limited quests
- Dynamic difficulty scaling
- Faction reputation impact
- Multiplayer quest sharing
