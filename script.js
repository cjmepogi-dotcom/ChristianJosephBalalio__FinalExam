// FitFuel Pro interactions
document.addEventListener('DOMContentLoaded', function () {
  // Mobile menu toggle
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  // Search filters the exercise cards
  var q = document.getElementById('q');
  if (q) {
    q.addEventListener('input', function () {
      var v = q.value.trim().toLowerCase();
      document.querySelectorAll('#lib .ex').forEach(function (card) {
        card.style.display = card.textContent.toLowerCase().includes(v) ? '' : 'none';
      });
    });
  }

  // Newsletter subscription
  var btn = document.getElementById('subBtn');
  var email = document.getElementById('em');
  var msg = document.getElementById('msg');
  if (btn && email && msg) {
    btn.addEventListener('click', function () {
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      msg.textContent = ok ? 'Subscribed. Check your inbox.' : 'Enter a valid email address.';
      if (ok) email.value = '';
    });
  }

  // Join Now: login / register modal
  var dlg = document.getElementById('auth');
  var tabs = { login: [document.getElementById('tabLogin'), document.getElementById('formLogin')],
               reg: [document.getElementById('tabReg'), document.getElementById('formReg')] };
  function showTab(name) {
    Object.keys(tabs).forEach(function (k) {
      var on = k === name;
      tabs[k][0].setAttribute('aria-selected', on);
      tabs[k][1].hidden = !on;
    });
    var f = tabs[name][1];
    var first = f.querySelector('input');
    if (first) first.focus();
  }
  function openAuth(name) {
    if (nav) nav.classList.remove('open');
    if (!dlg.open) dlg.showModal();
    showTab(name || 'login');
  }
  function closeAuth() { dlg.close(); }
  document.querySelectorAll('[data-join]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openAuth('login'); });
  });
  tabs.login[0].addEventListener('click', function () { showTab('login'); });
  tabs.reg[0].addEventListener('click', function () { showTab('reg'); });
  dlg.querySelectorAll('[data-tab]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); showTab(a.dataset.tab); });
  });
  document.getElementById('authClose').addEventListener('click', closeAuth);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeAuth(); });

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function handle(form, validate, onOk) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = form.querySelector('.err');
      form.querySelectorAll('input').forEach(function (i) { i.classList.remove('bad'); });
      err.classList.remove('ok');
      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = typeof v === 'string' ? v.trim() : v; });
      var res = validate(d);
      if (res) { err.textContent = res.msg; var f = form.elements[res.field]; if (f) { f.classList.add('bad'); f.focus(); } return; }
      err.classList.add('ok');
      onOk(d, err);
    });
  }
  function welcome(name) {
    var jb = document.getElementById('joinBtn');
    jb.textContent = 'Hi, ' + name;
    setTimeout(closeAuth, 1100);
  }
  handle(tabs.login[1], function (d) {
    if (!emailRe.test(d.email)) return { field: 'email', msg: 'Enter a valid email address.' };
    if (!d.password) return { field: 'password', msg: 'Enter your password.' };
  }, function (d, err) {
    err.textContent = 'Logged in. Welcome back.';
    welcome(d.email.split('@')[0]);
  });
  handle(tabs.reg[1], function (d) {
    if (d.name.length < 2) return { field: 'name', msg: 'Enter your full name.' };
    if (!emailRe.test(d.email)) return { field: 'email', msg: 'Enter a valid email address.' };
    if (d.password.length < 8) return { field: 'password', msg: 'Password must be at least 8 characters.' };
    if (d.password !== d.confirm) return { field: 'confirm', msg: 'Passwords do not match.' };
    if (!d.terms) return { field: 'terms', msg: 'Accept the Terms to continue.' };
  }, function (d, err) {
    err.textContent = 'Account created. Welcome to FitFuel Pro.';
    welcome(d.name.split(' ')[0]);
  });

  // Get Meal Plan: BMI based plan
  var pdlg = document.getElementById('planDlg');
  var pform = document.getElementById('planForm');
  var pout = document.getElementById('planOut');
  var PLANS = {
    under: { cat: 'Underweight', goal: 'Gain weight with a calorie surplus', adj: 400, pPerKg: 1.8, fat: 0.30,
      meals: [['Breakfast', 'Oats with whole milk, peanut butter, banana and whey'], ['Lunch', 'Grilled chicken, brown rice, avocado and roasted vegetables'], ['Snack', 'Greek yogurt, granola, honey and mixed nuts'], ['Dinner', 'Salmon, sweet potato, olive oil and steamed broccoli']] },
    normal: { cat: 'Healthy weight', goal: 'Maintain weight and build lean muscle', adj: 0, pPerKg: 1.8, fat: 0.28,
      meals: [['Breakfast', 'Oats, berries, chia seeds and a scoop of whey'], ['Lunch', 'Grilled chicken, quinoa, mixed greens and olive oil'], ['Snack', 'Protein shake with banana and almonds'], ['Dinner', 'Baked salmon, roasted vegetables and brown rice']] },
    over: { cat: 'Overweight', goal: 'Lose fat gradually with a moderate deficit', adj: -450, pPerKg: 1.8, fat: 0.28,
      meals: [['Breakfast', 'Egg white omelet with spinach and one slice of whole grain toast'], ['Lunch', 'Grilled chicken salad with chickpeas and lemon dressing'], ['Snack', 'Greek yogurt with berries'], ['Dinner', 'Baked fish, steamed vegetables and a small portion of quinoa']] },
    obese: { cat: 'Obese range', goal: 'Lose fat steadily with a larger deficit', adj: -600, pPerKg: 1.6, fat: 0.30,
      meals: [['Breakfast', 'Veggie scramble with two eggs and a side of fruit'], ['Lunch', 'Lean turkey or chicken with large salad and lentils'], ['Snack', 'Cottage cheese with cucumber or an apple'], ['Dinner', 'Grilled fish or tofu, roasted vegetables and a little brown rice']] }
  };
  var SPLIT = [0.25, 0.35, 0.15, 0.25];
  function renderPlan(d) {
    var hm = d.height / 100;
    var bmi = d.weight / (hm * hm);
    var key = bmi < 18.5 ? 'under' : bmi < 25 ? 'normal' : bmi < 30 ? 'over' : 'obese';
    var p = PLANS[key];
    var bmr = 10 * d.weight + 6.25 * d.height - 5 * d.age + (d.sex === 'm' ? 5 : -161);
    var kcal = bmr * d.activity + p.adj;
    var floor = d.sex === 'm' ? 1500 : 1200;
    var low = kcal < floor;
    if (low) kcal = floor;
    kcal = Math.round(kcal / 10) * 10;
    var protein = Math.round(Math.min(d.weight * p.pPerKg, kcal * 0.35 / 4));
    var fat = Math.round(kcal * p.fat / 9);
    var carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    var pos = Math.max(0, Math.min(100, (bmi - 15) / 25 * 100));
    var rows = p.meals.map(function (m, i) {
      return '<div class="meal"><span>' + m[0] + '<small>' + m[1] + '</small></span><b>' + Math.round(kcal * SPLIT[i] / 10) * 10 + ' kcal</b></div>';
    }).join('');
    pout.innerHTML =
      '<div class="bmi"><b>' + bmi.toFixed(1) + '</b><span>BMI: ' + p.cat + '</span></div>' +
      '<div class="gauge"><i style="left:' + pos + '%"></i></div>' +
      '<p class="gnote">Goal: ' + p.goal + '. Daily target: ' + kcal.toLocaleString() + ' kcal.' + (low ? ' Raised to a safe minimum.' : '') + '</p>' +
      '<div class="macros"><div><b>' + kcal.toLocaleString() + '</b><small>Calories</small></div><div><b>' + protein + 'g</b><small>Protein</small></div><div><b>' + carbs + 'g</b><small>Carbs</small></div><div><b>' + fat + 'g</b><small>Fats</small></div></div>' +
      '<h3>Today’s meals</h3>' + rows +
      '<p class="note2">Drink 2 to 3 litres of water daily. BMI is a rough screening tool and ignores muscle mass, so treat this as a starting point, not medical advice. Check with a doctor or dietitian if you have a health condition.</p>' +
      '<div class="cta" style="margin-top:16px"><button class="btn b1" type="button" id="planAgain">Recalculate</button><button class="btn b2" type="button" id="planPrint">Print plan</button></div>';
    pform.hidden = true;
    pout.hidden = false;
    document.getElementById('planAgain').addEventListener('click', function () {
      pout.hidden = true; pform.hidden = false;
    });
    document.getElementById('planPrint').addEventListener('click', function () { window.print(); });
    pdlg.scrollTop = 0;
  }
  document.querySelectorAll('[data-plan]').forEach(function (b) {
    b.addEventListener('click', function () { pdlg.showModal(); });
  });
  document.getElementById('planClose').addEventListener('click', function () { pdlg.close(); });
  pdlg.addEventListener('click', function (e) { if (e.target === pdlg) pdlg.close(); });
  pform.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = pform.querySelector('.err');
    pform.querySelectorAll('input').forEach(function (i) { i.classList.remove('bad'); });
    var d = {
      sex: pform.elements.sex.value,
      age: parseFloat(pform.elements.age.value),
      height: parseFloat(pform.elements.height.value),
      weight: parseFloat(pform.elements.weight.value),
      activity: parseFloat(pform.elements.activity.value)
    };
    var checks = [
      ['age', !(d.age >= 18 && d.age <= 80), 'This plan is for ages 18 to 80. Under 18, ask a doctor for guidance.'],
      ['height', !(d.height >= 120 && d.height <= 230), 'Enter your height in cm (120 to 230).'],
      ['weight', !(d.weight >= 30 && d.weight <= 250), 'Enter your weight in kg (30 to 250).']
    ];
    for (var i = 0; i < checks.length; i++) {
      if (checks[i][1]) {
        err.textContent = checks[i][2];
        var f = pform.elements[checks[i][0]]; f.classList.add('bad'); f.focus();
        return;
      }
    }
    err.textContent = '';
    renderPlan(d);
  });

  // Exercise library: View Exercises
  var L = ['Beginner', 'Intermediate', 'Advanced'];
  var LIB = {
    chest: { title: 'Chest workouts', intro: 'Train chest 1 to 2 times a week. Warm up with 2 light sets of the first move.', ex: [
      ['Incline push-up', 0, '3 x 10-15', 'Bench or box', 'Hands on a raised surface, body in one straight line.'],
      ['Push-up', 0, '3 x 8-15', 'Bodyweight', 'Lower your chest to the floor, elbows about 45 degrees from your sides.'],
      ['Machine chest press', 0, '3 x 10-12', 'Machine', 'Set the seat so handles line up with mid-chest.'],
      ['Dumbbell bench press', 1, '4 x 8-12', 'Dumbbells, bench', 'Lower with control until elbows are just below the bench.'],
      ['Incline dumbbell press', 1, '3 x 8-12', 'Dumbbells, incline bench', 'Use a 30 degree incline to target the upper chest.'],
      ['Cable fly', 1, '3 x 12-15', 'Cable machine', 'Keep a slight bend in the elbows and squeeze at the middle.'],
      ['Barbell bench press', 2, '4 x 5-8', 'Barbell, rack, bench', 'Plant your feet, retract your shoulder blades and use a spotter.'],
      ['Chest dip', 2, '3 x 8-12', 'Dip bars', 'Lean forward and lower until your upper arms are parallel to the floor.']
    ]},
    back: { title: 'Back workouts', intro: 'Train back 2 times a week. Pull with your elbows, not your hands.', ex: [
      ['Lat pulldown', 0, '3 x 10-12', 'Cable machine', 'Pull the bar to your upper chest and keep your torso tall.'],
      ['Seated cable row', 0, '3 x 10-12', 'Cable machine', 'Squeeze your shoulder blades together at the end of each rep.'],
      ['Inverted row', 0, '3 x 8-12', 'Bar or Smith machine', 'Keep your body straight and pull your chest to the bar.'],
      ['One-arm dumbbell row', 1, '3 x 8-12 each side', 'Dumbbell, bench', 'Drive your elbow toward your hip and avoid twisting.'],
      ['Face pull', 1, '3 x 12-15', 'Cable, rope', 'Pull to eye level, elbows high. Great for posture and shoulders.'],
      ['Barbell bent-over row', 1, '4 x 6-10', 'Barbell', 'Hinge at the hips with a flat back and pull to your lower ribs.'],
      ['Pull-up', 2, '3 x 6-10', 'Pull-up bar', 'Start from a full hang and pull your chin over the bar.'],
      ['Conventional deadlift', 2, '3 x 3-5', 'Barbell', 'Brace your core, keep the bar close and push the floor away.']
    ]},
    legs: { title: 'Leg workouts', intro: 'Train legs 2 times a week. Control the way down on every rep.', ex: [
      ['Bodyweight squat', 0, '3 x 15', 'Bodyweight', 'Sit between your hips, knees tracking over your toes.'],
      ['Glute bridge', 0, '3 x 12-15', 'Bodyweight or barbell', 'Pause for one second at the top and squeeze your glutes.'],
      ['Goblet squat', 0, '3 x 10-12', 'Dumbbell or kettlebell', 'Hold the weight at your chest and keep your torso upright.'],
      ['Walking lunge', 0, '3 x 10 each leg', 'Bodyweight or dumbbells', 'Take a long step and lower your back knee close to the floor.'],
      ['Leg press', 1, '4 x 10-12', 'Leg press machine', 'Do not lock out your knees and keep your lower back on the pad.'],
      ['Romanian deadlift', 1, '3 x 8-10', 'Barbell or dumbbells', 'Push your hips back, soft knees, feel the hamstring stretch.'],
      ['Standing calf raise', 1, '4 x 12-20', 'Step or machine', 'Pause at the top and stretch fully at the bottom.'],
      ['Bulgarian split squat', 2, '3 x 8-10 each leg', 'Dumbbells, bench', 'Rear foot on a bench, most of the weight on the front leg.'],
      ['Barbell back squat', 2, '4 x 5-8', 'Barbell, rack', 'Squat to at least parallel and keep your chest up.']
    ]},
    core: { title: 'Core exercises', intro: 'Train core 3 times a week. Quality beats quantity, so stop when your form slips.', ex: [
      ['Plank', 0, '3 x 30-45 sec', 'Bodyweight', 'Squeeze your glutes and keep your hips level.'],
      ['Dead bug', 0, '3 x 10 each side', 'Bodyweight', 'Press your lower back into the floor as you extend opposite limbs.'],
      ['Bicycle crunch', 0, '3 x 20', 'Bodyweight', 'Slow and controlled, rotate from the ribs, not the neck.'],
      ['Mountain climber', 0, '3 x 30 sec', 'Bodyweight', 'Hips low, drive your knees toward your chest.'],
      ['Side plank', 1, '3 x 30 sec each side', 'Bodyweight', 'Stack your feet and lift your hips to form a straight line.'],
      ['Russian twist', 1, '3 x 20', 'Plate or bodyweight', 'Lean back slightly and rotate your torso, not just your arms.'],
      ['Cable woodchop', 1, '3 x 12 each side', 'Cable machine', 'Rotate through the trunk and pivot your back foot.'],
      ['Hanging leg raise', 2, '3 x 8-12', 'Pull-up bar', 'Lift without swinging and curl your pelvis at the top.'],
      ['Ab wheel rollout', 2, '3 x 8-10', 'Ab wheel', 'Brace hard and roll out only as far as you can keep a flat back.']
    ]},
    cardio: { title: 'Cardio training', intro: 'Aim for 2 to 4 sessions a week. Easy sessions should still let you talk.', ex: [
      ['Brisk walking', 0, '30-45 min', 'Outdoors or treadmill', 'Use a pace that raises your heart rate but keeps you able to talk.'],
      ['Easy cycling', 0, '30-40 min', 'Bike or stationary bike', 'Keep a steady cadence of about 80 to 90 rpm.'],
      ['Elliptical intervals', 0, '20 min: 1 min hard, 2 min easy', 'Elliptical', 'Low impact, good for joints and recovery days.'],
      ['Jump rope', 1, '5 x 1 min, 30 sec rest', 'Jump rope', 'Small jumps, wrists doing the work, land softly on the balls of your feet.'],
      ['Rowing machine', 1, '15-20 min steady', 'Rower', 'Drive with the legs first, then lean back, then pull with the arms.'],
      ['Stair climber', 1, '15-20 min', 'Machine', 'Stand tall and avoid leaning heavily on the rails.'],
      ['Burpee intervals', 2, '8 x 30 sec on, 30 sec off', 'Bodyweight', 'Move fast but keep your form. Step back if you need to scale.'],
      ['Sprint intervals', 2, '8 x 20 sec sprint, 90 sec walk', 'Track, hill or bike', 'Warm up 10 minutes first. Go hard but stay relaxed.']
    ]}
  };
  var exDlg = document.getElementById('exDlg');
  var exList = document.getElementById('exList');
  var exChips = document.getElementById('exChips');
  var exState = { key: 'chest', lvl: -1 };
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function drawEx() {
    var g = LIB[exState.key];
    exChips.innerHTML = '';
    ['All'].concat(L).forEach(function (name, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = name;
      b.setAttribute('aria-pressed', exState.lvl === i - 1);
      b.addEventListener('click', function () { exState.lvl = i - 1; drawEx(); });
      exChips.appendChild(b);
    });
    exList.innerHTML = g.ex.filter(function (e) { return exState.lvl < 0 || e[1] === exState.lvl; }).map(function (e) {
      return '<li><div class="top"><h3>' + esc(e[0]) + '</h3><span class="lvl l' + (e[1] + 1) + '">' + L[e[1]] + '</span></div>' +
        '<div class="meta"><span>' + esc(e[2]) + '</span><span>' + esc(e[3]) + '</span></div><p>' + esc(e[4]) + '</p></li>';
    }).join('');
  }
  document.querySelectorAll('[data-ex]').forEach(function (b) {
    b.addEventListener('click', function () {
      exState = { key: b.dataset.ex, lvl: -1 };
      var g = LIB[exState.key];
      document.getElementById('exTitle').textContent = g.title + ' (' + g.ex.length + ' exercises)';
      document.getElementById('exIntro').textContent = g.intro;
      drawEx();
      exDlg.showModal();
      exDlg.querySelector('.auth').scrollTop = 0;
    });
  });
  document.getElementById('exClose').addEventListener('click', function () { exDlg.close(); });
  exDlg.addEventListener('click', function (e) { if (e.target === exDlg) exDlg.close(); });

  // Training programs by BMI
  var SESS = {
    sA: ['Squat and press', [['Barbell back squat', 5, '5'], ['Barbell bench press', 5, '5'], ['Barbell bent-over row', 4, '6'], ['Plank', 3, '45 sec']]],
    sB: ['Deadlift and pull', [['Conventional deadlift', 3, '5'], ['Overhead press', 4, '6'], ['Pull-up', 4, '6'], ['Romanian deadlift', 3, '8'], ['Hanging leg raise', 3, '8']]],
    sC: ['Full-body power', [['Goblet squat', 4, '6'], ['Dumbbell bench press', 4, '6'], ['One-arm dumbbell row', 3, '8 each side'], ['Farmer’s carry', 3, '30 m'], ['Side plank', 3, '30 sec each side']]],
    sD: ['Upper strength', [['Barbell bench press', 5, '5'], ['Barbell bent-over row', 5, '5'], ['Overhead press', 4, '6'], ['Pull-up', 3, '6'], ['Face pull', 3, '12']]],
    sE: ['Lower strength', [['Barbell back squat', 5, '5'], ['Romanian deadlift', 4, '6'], ['Leg press', 3, '8'], ['Standing calf raise', 4, '10'], ['Ab wheel rollout', 3, '8']]],
    lA: ['Full-body circuit A', [['Goblet squat', 3, '12'], ['Push-up', 3, '10'], ['Seated cable row', 3, '12'], ['Glute bridge', 3, '15'], ['Plank', 3, '30 sec'], ['Brisk incline walk', 0, '15 min']]],
    lB: ['Full-body circuit B', [['Walking lunge', 3, '10 each leg'], ['Dumbbell bench press', 3, '12'], ['Lat pulldown', 3, '12'], ['Romanian deadlift', 3, '10'], ['Bicycle crunch', 3, '20'], ['Easy cycling', 0, '15 min']]],
    lH: ['Interval cardio', [['Jump rope', 6, '30 sec on, 30 sec off'], ['Burpee', 4, '30 sec on, 30 sec off'], ['Mountain climber', 4, '30 sec'], ['Rowing machine', 0, '10 min steady']]],
    lS: ['Steady cardio', [['Brisk walking', 0, '40 min'], ['Stretching and mobility', 0, '10 min']]],
    lR: ['Active recovery', [['Easy walk', 0, '30 min'], ['Stretching and mobility', 0, '15 min']]],
    mPush: ['Push', [['Barbell bench press', 4, '8'], ['Incline dumbbell press', 3, '10'], ['Overhead press', 3, '10'], ['Lateral raise', 3, '15'], ['Cable fly', 3, '12'], ['Triceps pushdown', 3, '12']]],
    mPull: ['Pull', [['Pull-up', 4, '8'], ['Barbell bent-over row', 4, '8'], ['Seated cable row', 3, '10'], ['Face pull', 3, '15'], ['Dumbbell curl', 3, '12'], ['Hammer curl', 3, '12']]],
    mLegs: ['Legs', [['Barbell back squat', 4, '8'], ['Romanian deadlift', 3, '10'], ['Leg press', 3, '12'], ['Walking lunge', 3, '10 each leg'], ['Standing calf raise', 4, '15'], ['Hanging leg raise', 3, '10']]],
    mUp: ['Upper body', [['Dumbbell bench press', 4, '10'], ['One-arm dumbbell row', 4, '10'], ['Overhead press', 3, '10'], ['Lat pulldown', 3, '12'], ['Dumbbell curl', 3, '12'], ['Triceps pushdown', 3, '12']]],
    mLow: ['Lower body', [['Barbell back squat', 4, '10'], ['Romanian deadlift', 4, '10'], ['Bulgarian split squat', 3, '10 each leg'], ['Leg curl', 3, '12'], ['Standing calf raise', 4, '15'], ['Plank', 3, '45 sec']]]
  };
  var PROGS = {
    strength: { title: 'Strength training program', intro: 'Heavy compound lifts with progressive overload.',
      plan: { 3: ['sA', 'sB', 'sC'], 4: ['sD', 'sE', 'sD', 'sE'], 5: ['sA', 'sB', 'sD', 'sE', 'sC'] },
      prog: 'Add 2.5 kg to upper-body lifts and 5 kg to lower-body lifts each week when you hit every rep. Week 4 is a deload: use 60% of your weights.' },
    loss: { title: 'Weight loss program', intro: 'Full-body circuits and cardio that burn calories and protect muscle.',
      plan: { 3: ['lA', 'lH', 'lB'], 4: ['lA', 'lH', 'lB', 'lS'], 5: ['lA', 'lH', 'lB', 'lS', 'lR'] },
      prog: 'Each week add 1 to 2 reps per set or 5 minutes to a cardio session. Pair this with the calorie deficit from your meal plan.' },
    muscle: { title: 'Muscle building program', intro: 'High-volume hypertrophy training with a split built for growth.',
      plan: { 3: ['mPush', 'mPull', 'mLegs'], 4: ['mUp', 'mLow', 'mUp', 'mLow'], 5: ['mPush', 'mPull', 'mLegs', 'mUp', 'mLow'] },
      prog: 'When you hit the top of the rep range on every set, add the smallest weight jump available. Week 4 is a deload: cut sets in half.' }
  };
  var BMIC = {
    under: { cat: 'Underweight', sets: 0, swap: {}, tips: ['Keep cardio to one easy 20 minute session a week so you save calories for growth.', 'Rest 2 to 3 minutes between heavy sets and sleep 8 hours.', 'Eat in a calorie surplus. Use the Get Meal Plan button for your numbers.'] },
    normal: { cat: 'Healthy weight', sets: 0, swap: {}, tips: ['Rest 60 to 120 seconds between sets.', 'Add 1 to 2 easy cardio sessions a week for heart health.', 'Eat around maintenance calories, with 1.6 to 2 g of protein per kg.'] },
    over: { cat: 'Overweight', sets: 0, swap: { 'Burpee': 'Incline push-up into squat', 'Jump rope': 'Cycling intervals', 'Mountain climber': 'Dead bug', 'Pull-up': 'Lat pulldown', 'Hanging leg raise': 'Dead bug', 'Ab wheel rollout': 'Plank' }, tips: ['High-impact moves are swapped for joint-friendly ones.', 'Add two 25 minute low-impact cardio sessions a week, such as incline walking or cycling.', 'Rest 60 to 90 seconds between sets and aim for a moderate calorie deficit.'] },
    obese: { cat: 'Obese range', sets: -1, swap: { 'Burpee': 'Incline push-up into squat', 'Jump rope': 'Cycling intervals', 'Mountain climber': 'Dead bug', 'Pull-up': 'Lat pulldown', 'Hanging leg raise': 'Dead bug', 'Ab wheel rollout': 'Plank', 'Walking lunge': 'Box squat', 'Bulgarian split squat': 'Step-up', 'Barbell back squat': 'Goblet squat', 'Conventional deadlift': 'Romanian deadlift', 'Rowing machine': 'Easy cycling' }, tips: ['Every exercise is low-impact and uses machines or stable positions first. Sets are reduced by one to build a base.', 'Walk 20 to 30 minutes every day and build up gradually.', 'Rest as long as you need between sets. Stop any move that hurts a joint, and check with a doctor before starting.'] }
  };
  var progDlg = document.getElementById('progDlg');
  var progForm = document.getElementById('progForm');
  var progOut = document.getElementById('progOut');
  var progKey = 'strength';
  var DAYS = { 3: ['Mon', 'Wed', 'Fri'], 4: ['Mon', 'Tue', 'Thu', 'Fri'], 5: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] };
  function renderProg(d) {
    var P = PROGS[progKey];
    var bmi = d.weight / Math.pow(d.height / 100, 2);
    var key = bmi < 18.5 ? 'under' : bmi < 25 ? 'normal' : bmi < 30 ? 'over' : 'obese';
    var B = BMIC[key];
    var pos = Math.max(0, Math.min(100, (bmi - 15) / 25 * 100));
    var days = DAYS[d.days];
    var html = P.plan[d.days].map(function (sk, i) {
      var S = SESS[sk];
      var items = S[1].map(function (it) {
        var name = B.swap[it[0]] || it[0];
        var amt = it[1] === 0 ? it[2] : Math.max(2, it[1] + B.sets) + ' x ' + it[2];
        return '<li><b>' + name + '</b>: ' + amt + '</li>';
      }).join('');
      return '<li class="day"><div class="top"><h3>' + days[i] + ': ' + S[0] + '</h3><span class="tagd">Day ' + (i + 1) + '</span></div><ol>' + items + '</ol></li>';
    }).join('');
    var tips = B.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    document.getElementById('progTitle').textContent = P.title;
    progOut.innerHTML =
      '<div class="bmi"><b>' + bmi.toFixed(1) + '</b><span>BMI: ' + B.cat + '</span></div>' +
      '<div class="gauge"><i style="left:' + pos + '%"></i></div>' +
      '<p class="gnote">' + d.days + ' training days a week, adjusted for your BMI.</p>' +
      '<h3 style="font-size:1.3rem;margin:12px 0 0">Adjustments for you</h3><ul class="tips">' + tips + '</ul>' +
      '<h3 style="font-size:1.3rem;margin:16px 0 0">Your weekly schedule</h3><ul class="exlist">' + html + '</ul>' +
      '<h3 style="font-size:1.3rem;margin:16px 0 0">How to progress</h3><p class="gnote">' + P.prog + ' Warm up for 5 to 10 minutes before every session.</p>' +
      '<p class="note2">BMI is a rough screening tool and ignores muscle mass. This is general guidance, not medical advice. Check with a doctor if you have a health condition or pain.</p>' +
      '<div class="cta" style="margin-top:16px"><button class="btn b1" type="button" id="progMeal">Get my meal plan</button><button class="btn b2" type="button" id="progAgain">Recalculate</button><button class="btn b2" type="button" id="progPrint">Print program</button></div>';
    progForm.hidden = true;
    progOut.hidden = false;
    document.getElementById('progAgain').addEventListener('click', function () { progOut.hidden = true; progForm.hidden = false; });
    document.getElementById('progPrint').addEventListener('click', function () { window.print(); });
    document.getElementById('progMeal').addEventListener('click', function () { progDlg.close(); pdlg.showModal(); });
    progDlg.querySelector('.auth').scrollTop = 0;
  }
  function openProg(k) {
    progKey = k;
    document.getElementById('progTitle').textContent = PROGS[k].title;
    document.getElementById('progIntro').textContent = PROGS[k].intro + ' Enter your details and we build a weekly plan around your BMI.';
    progOut.hidden = true;
    progForm.hidden = false;
    progDlg.showModal();
  }
  document.querySelectorAll('[data-prog]').forEach(function (el) {
    el.addEventListener('click', function () { openProg(el.dataset.prog); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProg(el.dataset.prog); }
    });
  });
  document.getElementById('progClose').addEventListener('click', function () { progDlg.close(); });
  progDlg.addEventListener('click', function (e) { if (e.target === progDlg) progDlg.close(); });
  progForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = progForm.querySelector('.err');
    progForm.querySelectorAll('input').forEach(function (i) { i.classList.remove('bad'); });
    var d = {
      age: parseFloat(progForm.elements.age.value),
      days: parseInt(progForm.elements.days.value, 10),
      height: parseFloat(progForm.elements.height.value),
      weight: parseFloat(progForm.elements.weight.value)
    };
    var checks = [
      ['age', !(d.age >= 18 && d.age <= 80), 'This program is for ages 18 to 80. Under 18, ask a doctor or coach for guidance.'],
      ['height', !(d.height >= 120 && d.height <= 230), 'Enter your height in cm (120 to 230).'],
      ['weight', !(d.weight >= 30 && d.weight <= 250), 'Enter your weight in kg (30 to 250).']
    ];
    for (var i = 0; i < checks.length; i++) {
      if (checks[i][1]) {
        err.textContent = checks[i][2];
        var f = progForm.elements[checks[i][0]]; f.classList.add('bad'); f.focus();
        return;
      }
    }
    err.textContent = '';
    renderProg(d);
  });
});
