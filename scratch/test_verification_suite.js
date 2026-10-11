// scratch/test_verification_suite.js
import { memberService } from '../src/firebase/services/memberService.js';
import { userResolver } from '../src/firebase/services/userResolver.js';

console.log("Member service loaded successfully:", typeof memberService.createMember === 'function');
console.log("User resolver loaded successfully:", typeof userResolver.resolveCurrentUser === 'function');
