import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const rawDataset = `1379\tkiran_cse@kluniversity.in
1498\tvaraprasad_cse@kluniversity.in
2496\tpvrao@kluniversity.in
3658\tpradeepini_cse@kluniversity.in
3908\tnrajeshcse@kluniversity.in
4056\tmcchakravarthy@kluniversity.in
4821\tram.fuzzy@kluniversity.in
5372\tshaikshavali@kluniversity.in
5422\tradha@kluniversity.in
5495\tpraveenluru@kluniversity.in
5659\tcnu.pvvs@kluniversity.in
5886\tkvprasad@kluniversity.in
5900\tvijaybru@kluniversity.in
5908\tnallagatlaraghavendra@kluniversity.in
6096\tjvnramesh@kluniversity.in
6584\tumarkcse@kluniversity.in
6616\tsureshdkumarmca@kluniversity.in
6786\tdr.kswathi@kluniversity.in
6874\tyamunadevimm@kluniversity.in
6922\tnesaraniabraham84@kluniversity.in
6931\tveerankalu14@kluniversity.in
6932\tmath.renuka@kluniversity.in
6934\tsabithakiran.ch@kluniversity.in
7004\travelalikes@kluniversity.in
7152\tnamachivayam77@kluniversity.in
7190\teguruvareddy@kluniversity.in
7239\tbrahmaraokbv@kluniversity.in
7255\tdrtkr@kluniversity.in
7366\tlakshmareddy@kluniversity.in
7401\trajeshtulasi@kluniversity.in
7414\tadapagopi@kluniversity.in
7510\tdayanidhi@kluniversity.in
7792\tchnagamani@kluniversity.in
7814\tkggupta@kluniversity.in
7936\tvprasanthi@kluniversity.in
7960\teraveenndrareddy@kluniversity.in
7984\tpandiyanathan@kluniversity.in
7985\tpmuralikrishna@kluniversity.in
7986\tpdineshchandra@kluniversity.in
7999\tjayaramakrishnaiah@kluniversity.in
8000\tjyotsnadevi@kluniversity.in
8020\tnathapriya@kluniversity.in
8021\tdeepthin@kluniversity.in
8059\tpramadevi@kluniversity.in
8080\tkavitha.sarihaddu@kluniversity.in
8084\tnyshpranee@kluniversity.in
8104\tsatrughankumar@kluniversity.in
8110\tasruthi@kluniversity.in
8120\tjaganmohan@kluniversity.in
8129\tpbalaji@kluniversity.in
8130\trudra.kuna@kluniversity.in
8137\tpvenkataanusha@kluniversity.in
8146\tpsridevi@kluniversity.in
8147\tksadhana@kluniversity.in
8154\tb.balakrishna@kluniversity.in
8163\tlnarasimhaswamy@kluniversity.in
8164\tbndeepthi@kluniversity.in
8168\tanjuaravindk@kluniversity.in
8171\tmsvsureshbabu@kluniversity.in
8172\tgannapurna@kluniversity.in
8175\tmsivudu@kluniversity.in
8176\tysivaramaiah@kluniversity.in
8177\tkvenkateswarao@kluniversity.in
8190\ttejolakshmi@kluniversity.in
8193\tksailaja@kluniversity.in
8196\tmvenkatrao@kluniversity.in
8199\tkalahotirambabu@kluniversity.in
8200\tklalithavanisree@kluniversity.in
8282\tulakshmisoundharya@kluniversity.in
8296\tsrinivasaraov@kluniversity.in
8297\tmravisankar@kluniversity.in
8335\tplakshmanarao@kluniversity.in
8339\trsmlakshmi@kluniversity.in
8353\tsdrakshayani@kluniversity.in
8416\tpramodhkrishna@kluniversity.in
8428\tamounika@kluniversity.in
8440\tchjhansirani@kluniversity.in
8533\tplkishankumar@kluniversity.in
8591\tjevinja@kluniversity.in
8592\tyrajesh@kluniversity.in
8635\tppraveenkumar@kluniversity.in
8701\tmashiqueazad@kluniversity.in
8707\tnaravind@kluniversity.in
8806\ttchithrakumar@kluniversity.in
8820\tbsahiti@kluniversity.in
8823\tmsomasundararao@kluniversity.in
8836\tramyadudigam@kluniversity.in
8853\ttkrishnakishore@kluniversity.in
8864\tsujanbabuv@kluniversity.in
8873\tlakkakulasrilatha@kluniversity.in
8899\tvkrishnareddy@kluniversity.in
8905\tanuradhakonidena@kluniversity.in
8906\tshaikjilanibasha@kluniversity.in
8909\tprasunamanikya@kluniversity.in
8913\tgarladinneravikanth@kluniversity.in
8913\tgarladinneravikanth@kluniversity.in
8916\tsivaramarajuvetukuri@kluniversity.in
8922\tedsusan@kluniversity.in
8964\ttirapathireddyb@kluniversity.in\u00a0
8969\tasathyavani@kluniversity.in
8978\tksanthi@kluniversity.in
8981\tssuneetha@kluniversity.in
8996\tvshiyam@kluniversity.in
8997\tmaheswaribandi@kluniversity.in
9020\tedupugantimounika@kluniversity.in
9028\tjvenkatrao@kluniversity.in
9034\tsandeepnanda@kluniversity.in
9035\tssrinivasulu@kluniversity.in
9037\tshaiksanheera@kluniversity.in
9131\tlekhanasrilakshmi@kluniversity.in
9255\tkoppulapravallika@kluniversity.in
9377\tnyaswanthsai@kluniversity.in
9391\ttsailaja@kluniversity.in
9413\tramadevichappala@kluniversity.in
9427\tchandudelhi@kluniversity.in
9484\tvmbindu@kluniversity.in
9634\tnvijayagopal@kluniversity.in
9714\tyvkdbhavani@kluniversity.in
9828\trranjithkumar@kluniversity.in
9923\tyenumalasankar@kluniversity.in
9953\tykassish@kluniversity.in
9960\tsatyabrat@kluniversity.in
9968\tpkirankumar@kluniversity.in
9978\tsbabu@kluniversity.in
10031\tnbpamula@kluniversity.in
10039\tjramadevi@kluniversity.in
10040\tvbhargavi@kluniversity.in`;

const lines = rawDataset.split('\n').filter(l => l.trim());
console.log("Total records parsed:", lines.length);

const parsed = [];
const empIdMap = new Map();
const emailMap = new Map();

let dupEmpCount = 0;
let dupEmailCount = 0;
let invalidEmailCount = 0;
let missingEmpIdCount = 0;
let missingEmailCount = 0;

lines.forEach((line, idx) => {
  const parts = line.split('\t');
  let empId = parts[0] ? parts[0].trim() : '';
  let email = parts[1] ? parts[1].trim().replace(/\u00a0/g, '') : ''; // Clean non-breaking space

  if (!empId) missingEmpIdCount++;
  if (!email) missingEmailCount++;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    invalidEmailCount++;
    console.warn(`Line ${idx + 1}: Invalid email: "${email}"`);
  }

  if (empIdMap.has(empId)) {
    dupEmpCount++;
    const prev = empIdMap.get(empId);
    console.log(`Duplicate Employee ID ${empId}: Prev Email="${prev.email}", Current Email="${email}"`);
  } else {
    empIdMap.set(empId, { empId, email });
  }

  if (emailMap.has(email)) {
    dupEmailCount++;
    const prev = emailMap.get(email);
    console.log(`Duplicate Email ${email}: Prev EmpID="${prev.empId}", Current EmpID="${empId}"`);
  } else {
    emailMap.set(email, { empId, email });
  }

  parsed.push({ empId, email });
});

console.log("\n--- Validation Summary ---");
console.log("Total raw records:", lines.length);
console.log("Unique Employees (by Employee ID & Email):", empIdMap.size);
console.log("Duplicate Employee IDs:", dupEmpCount);
console.log("Duplicate Emails:", dupEmailCount);
console.log("Invalid Emails:", invalidEmailCount);
console.log("Missing Employee IDs:", missingEmpIdCount);
console.log("Missing Emails:", missingEmailCount);
