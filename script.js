
function roundHalf(num) {
  return Math.round(num * 2) / 2;
}

function calcDoseRange(inr, weeklyDose, bleeding) {
  let low = weeklyDose;
  let high = weeklyDose;
  let advice = '';

  if (bleeding === 'yes') {
    advice = 'มีเลือดออกอย่างรุนแรง: ให้ Vitamin K1 10 mg IV และ FFP/PCC/rFVIIa';
  } else {
    if (inr < 1.5) {
      low = weeklyDose * 1.10;
      high = weeklyDose * 1.20;
      advice = 'เพิ่มขนาดยารายสัปดาห์ 10–20%';
    } else if (inr < 2.0) {
      low = weeklyDose * 1.05;
      high = weeklyDose * 1.10;
      advice = 'เพิ่ม 5–10% หรือไม่ต้องปรับ แต่ติดตามค่า INR บ่อยขึ้น';
    } else if (inr <= 3.0) {
      advice = 'ไม่ต้องปรับยา';
    } else if (inr <= 3.9) {
      low = weeklyDose * 0.90;
      high = weeklyDose * 0.95;
      advice = 'ลดขนาดยารายสัปดาห์ 5–10%';
    } else if (inr <= 5.0) {
      low = weeklyDose * 0.90;
      high = weeklyDose * 0.90;
      advice = 'หยุดยา 1 วัน แล้วกลับมาเริ่มด้วยขนาดที่ลดลง 10%';
    } else if (inr <= 9.0) {
      low = weeklyDose * 0.80;
      high = weeklyDose * 0.80;
      advice = 'หยุดยา 2 วัน แล้วกลับมาเริ่มด้วยขนาดที่ลดลง 20%';
    } else {
      advice = 'หยุดยา ให้ Vitamin K1 2.5–5 mg รับประทาน และติดตาม INR อย่างใกล้ชิด';
    }
  }
  return { low, high, advice };
}

function distributeDose(dosePerWeek, tabletType) {
  // แบ่งยา 7 วัน
  // 1. ใช้เม็ด 3 mg ก่อน (ถ้ามี)
  // 2. เติมเม็ด 2 mg เพื่อใกล้เคียงเป้าหมาย
  // คืนค่าตาราง array [ {day:1, t3:0.5, t2:1} ... ]
  let plan = [];
  const days = 7;
  let dailyDose = dosePerWeek / days;

  for (let i = 0; i < days; i++) {
    let t3 = 0;
    let t2 = 0;
    if (tabletType === '3') {
      t3 = roundHalf(dailyDose / 3);
      t2 = 0;
    } else if (tabletType === '2') {
      t3 = 0;
      t2 = roundHalf(dailyDose / 2);
    } else {
      // both
      t3 = Math.floor(dailyDose / 3);
      let remain = dailyDose - t3 * 3;
      t2 = roundHalf(remain / 2);
      // กรณี half dose สำหรับ t3
      if (dailyDose % 3 >= 1.5) {
        t3 += 0.5;
        t2 = roundHalf((dailyDose - t3 * 3) / 2);
      }
      // ปัดให้เป็น 0, 0.5 หรือ 1 เม็ด
      t3 = Math.min(Math.max(t3, 0), 2);
      t2 = Math.min(Math.max(t2, 0), 2);
    }
    plan.push({ day: i + 1, t3, t2 });
  }
  return plan;
}

function planToTable(plan) {
  let html = '<table><thead><tr><th>วัน</th><th>3 mg (เม็ด)</th><th>2 mg (เม็ด)</th><th>mg/วัน</th></tr></thead><tbody>';
  for (const day of plan) {
    let mg = day.t3 * 3 + day.t2 * 2;
    html += `<tr><td>วัน${day.day}</td><td>${day.t3}</td><td>${day.t2}</td><td>${mg.toFixed(1)}</td></tr>`;
  }
  html += '</tbody></table>';
  return html;
}

function sumTablets(plan) {
  let sum3 = 0;
  let sum2 = 0;
  for (const day of plan) {
    sum3 += day.t3;
    sum2 += day.t2;
  }
  return { sum3, sum2 };
}

document.getElementById('calculate').addEventListener('click', () => {
  const inr = parseFloat(document.getElementById('inr').value);
  const weeklyDose = parseFloat(document.getElementById('weeklyDose').value);
  const days = parseInt(document.getElementById('days').value);
  const tabletType = document.querySelector('input[name="tablet"]:checked').value;
  const bleeding = document.querySelector('input[name="bleeding"]:checked').value;

  if (isNaN(inr) || isNaN(weeklyDose) || isNaN(days) || days <= 0) {
    alert('กรุณากรอกข้อมูลให้ครบและถูกต้อง');
    return;
  }

  const { low, high, advice } = calcDoseRange(inr, weeklyDose, bleeding);
  const avg = (low + high) / 2;

  const planLow = distributeDose(low, tabletType);
  const planHigh = distributeDose(high, tabletType);
  const planAvg = distributeDose(avg, tabletType);

  const sumLow = sumTablets(planLow);
  const sumHigh = sumTablets(planHigh);
  const sumAvg = sumTablets(planAvg);

  let results = `<h3>ขนาดยาใหม่ต่อสัปดาห์: ${low.toFixed(1)} - ${high.toFixed(1)} mg (เฉลี่ย ${avg.toFixed(1)} mg)</h3>`;
  results += `<p>คำแนะนำ: ${advice}</p>`;

  results += '<h4>แผนการให้ยา 7 วัน (ต่ำสุด)</h4>';
  results += planToTable(planLow);
  results += `<p>รวมเม็ด 3 mg: ${sumLow.sum3.toFixed(1)} เม็ด, 2 mg: ${sumLow.sum2.toFixed(1)} เม็ด</p>`;

  results += '<h4>แผนการให้ยา 7 วัน (เฉลี่ย)</h4>';
  results += planToTable(planAvg);
  results += `<p>รวมเม็ด 3 mg: ${sumAvg.sum3.toFixed(1)} เม็ด, 2 mg: ${sumAvg.sum2.toFixed(1)} เม็ด</p>`;

  results += '<h4>แผนการให้ยา 7 วัน (สูงสุด)</h4>';
  results += planToTable(planHigh);
  results += `<p>รวมเม็ด 3 mg: ${sumHigh.sum3.toFixed(1)} เม็ด, 2 mg: ${sumHigh.sum2.toFixed(1)} เม็ด</p>`;

  document.getElementById('results').innerHTML = results;
});
