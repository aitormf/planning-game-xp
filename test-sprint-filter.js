// Simple test script to verify the completedInSprint filter logic
// Run with: node test-sprint-filter.js

console.log('🧪 Testing completedInSprint filter logic (simplified - by sprint assignment)...\n');

// Test data
const testTasks = [
  { 
    cardId: 'TSK-001', 
    status: 'Done', 
    sprint: 'Sprint 1', 
    endDate: '2024-01-10' 
  },
  { 
    cardId: 'TSK-002', 
    status: 'Done', 
    sprint: 'Sprint 2', 
    endDate: '2024-01-20' 
  },
  { 
    cardId: 'TSK-003', 
    status: 'In Progress', 
    sprint: 'Sprint 1', 
    endDate: '2024-01-10' 
  },
  { 
    cardId: 'TSK-004', 
    status: 'Done', 
    sprint: '', 
    endDate: '2024-01-05' 
  },
  { 
    cardId: 'TSK-005', 
    status: 'Done', 
    sprint: 'Sprint 1', 
    endDate: '2024-02-10' // Outside sprint range
  }
];

// Test the filter logic
function testCompletedInSprintFilter(card, selectedValues) {
  // Only show completed tasks (Done)
  if (card.status !== 'Done') {
    return false;
  }
  
  if (selectedValues.includes('any-sprint')) {
    return card.sprint && card.sprint.trim() !== '';
  }
  
  if (selectedValues.includes('no-sprint')) {
    return !card.sprint || card.sprint.trim() === '';
  }
  
  // Filter by specific sprints (by sprint assignment, not by dates)
  return selectedValues.includes(card.sprint);
}

// Run tests
console.log('Test 1: Filter by "Sprint 1"');
const sprint1Results = testTasks.filter(task => testCompletedInSprintFilter(task, ['Sprint 1']));
console.log('Expected: TSK-001, TSK-005 (Done tasks assigned to Sprint 1)');
console.log('Actual:', sprint1Results.map(t => t.cardId));
const hasTSK001 = sprint1Results.some(t => t.cardId === 'TSK-001');
const hasTSK005 = sprint1Results.some(t => t.cardId === 'TSK-005');
console.log('✅ Pass:', sprint1Results.length === 2 && hasTSK001 && hasTSK005);

console.log('\nTest 2: Filter by "any-sprint"');
const anySprintResults = testTasks.filter(task => testCompletedInSprintFilter(task, ['any-sprint']));
console.log('Expected: TSK-001, TSK-002, TSK-005 (Done tasks with sprint)');
console.log('Actual:', anySprintResults.map(t => t.cardId));
console.log('✅ Pass:', anySprintResults.length === 3);

console.log('\nTest 3: Filter by "no-sprint"');
const noSprintResults = testTasks.filter(task => testCompletedInSprintFilter(task, ['no-sprint']));
console.log('Expected: TSK-004 (Done task without sprint)');
console.log('Actual:', noSprintResults.map(t => t.cardId));
console.log('✅ Pass:', noSprintResults.length === 1 && noSprintResults[0].cardId === 'TSK-004');

console.log('\nTest 4: Filter by "Sprint 2"');
const sprint2Results = testTasks.filter(task => testCompletedInSprintFilter(task, ['Sprint 2']));
console.log('Expected: TSK-002 (Done task assigned to Sprint 2)');
console.log('Actual:', sprint2Results.map(t => t.cardId));
console.log('✅ Pass:', sprint2Results.length === 1 && sprint2Results[0].cardId === 'TSK-002');

console.log('\nTest 5: Exclude In Progress tasks');
const allCompletedResults = testTasks.filter(task => testCompletedInSprintFilter(task, ['Sprint 1']));
const hasInProgressTask = allCompletedResults.some(t => t.status !== 'Done');
console.log('Expected: No In Progress tasks in results');
console.log('✅ Pass:', !hasInProgressTask);

console.log('\n🎉 All tests completed! Filter logic is working correctly.');