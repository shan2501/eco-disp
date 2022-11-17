var numberGeneratorsGlobal = 3;
const coeffsSize = 3;

function getInitialLambda(powerDemand, D, coeffs, limits) {
    let denominator = 0;
    for (let i=0; i<D; ++i) {
        let a = coeffs[i][0], b = coeffs[i][1], c = coeffs[i][2];
        denominator += 1 / (2.0*c);
    }
    let numerator = powerDemand;
    for (let i=0; i<D; ++i) {
        let a = coeffs[i][0], b = coeffs[i][1], c = coeffs[i][2];
        numerator += b / (2.0*c);
    }
    return numerator/denominator;
}

function economicLoadDispatch(powerDemand, D, coeffs, limits) {
    let lambda = getInitialLambda(powerDemand, D, coeffs, limits);
    let eps = 0.001;
    let dP = Infinity;
    let optimalUnits = Array(D).fill(0);
    const maxItrCount = 100;

    console.log(`Initial Lambda = ${lambda}`);
    let itrCount = 0;

    while(dP > eps) {
        // Lambda iteration
        dP = powerDemand;
        for (let i=0; i<D; ++i) {
            let a = coeffs[i][0], b = coeffs[i][1], c = coeffs[i][2];
            let Pg = (lambda - b) / (2.0*c);
            let minLimit = limits[i][0], maxLimit = limits[i][1];
            Pg = Math.max(Pg, minLimit);
            Pg = Math.min(Pg, maxLimit);
            dP -= Pg;
            optimalUnits[i] = Pg;
        }
        let denominator = 0;
        for (let i=0; i<D; ++i) {
            let a = coeffs[i][0], b = coeffs[i][1], c = coeffs[i][2];
            denominator += 1 / (2.0*c);
        }
        let dLambda = dP / denominator;
        lambda += dLambda;
        console.log(`Iteration ${itrCount}: ${optimalUnits}`);
        ++itrCount;

        if (itrCount > maxItrCount) {
            console.error("Maximum iterations occured");
            break;
        }
    }

    return optimalUnits;
}

function calculateCost(D, coeffs, limits, generationUnits) {
    let costs = Array(D).fill(0);
    let totalCost = 0;
    for (let i=0; i<D; ++i) {
        let cost = 0;
        let unit = generationUnits[i];
        for (let j=0; j<coeffs[i].length; ++j) {
            cost += coeffs[i][j] * Math.pow(unit, j);
        }
        totalCost += cost;
        costs[i] = cost;
    }
    let res = {'costs': costs, 'totalCost': totalCost};
    return res;
}

function submit() {
    console.log("Hello in submit");
    input = getInput();
    validatedInput = validateInput(input);
    console.log(validatedInput);
    resetOutput();

    if (validatedInput['valid']) {
        console.log(input)
        let powerDemand = input['powerDemand'];
        let D = input['numberGenerators'];
        let coeffs = input['coeffs'];
        let limits = input['limits'];
        unitsOptimal = economicLoadDispatch(powerDemand, D, coeffs, limits);
        console.log(unitsOptimal);
        costDetailsOptimal = calculateCost(D, coeffs, limits, unitsOptimal);
        console.log(costDetailsOptimal);
        let unitsEqual = Array(D).fill(powerDemand/D);
        costDetailsEqual = calculateCost(D, coeffs, limits, unitsEqual);
        console.log(costDetailsEqual);

        output = {'unitsOptimal':unitsOptimal, 'costDetailsOptimal': costDetailsOptimal, 'costDetailsEqual': costDetailsEqual};
        showOutput(output);
    } else {
        console.error(validatedInput['errors']);
        showErrorList(validatedInput['errors']);
    }
}

function updateNumberOfGenerators() {
    console.log("In updateNumberOfGenerators");
    let numberGenerators = document.getElementById('number-generators-input').value;
    let errors = [];
    numberGenerators = Number(numberGenerators);
    if (Number.isNaN(numberGenerators))
        errors.push('Invalid input for Number of generators');
    if (numberGenerators <= 0)
        errors.push('Number of generators should be > 0');
    let valid = (errors.length==0 ? true:false);
    console.log(numberGenerators);
    if (!valid) {
        console.error(errors);
        showErrorList(errors);
        return;
    }
    hideErrorList();
    updateInputTable(numberGenerators);
}

function updateInputTable(numberGenerators) {
    numberGeneratorsGlobal = numberGenerators;
    let inputTableBodyElement = document.getElementById('input-coeffs-table-body');
    inputTableBodyElement.innerHTML = '';
    for (let i=0; i<numberGeneratorsGlobal; ++i) {
        let tr = document.createElement('tr');
        let th = document.createElement('th');
        th.scope = "row";
        th.textContent = i+1;
        tr.appendChild(th);
        params = [
        {'id': 'min', 'placeholder':'10'}, 
        {'id': 'max', 'placeholder':'100'},
        {'id': 'coeff-1', 'placeholder': '20'},
        {'id': 'coeff-2', 'placeholder': '3'},
        {'id': 'coeff-3', 'placeholder': '0.01'}
        ];
        commonparams = {'type':"number", 'step':"any", 'className': "form-control"};

        for (let j=0; j<params.length; ++j) {
            let td = document.createElement('td');
            let input = document.createElement('input');
            for (const [key, value] of Object.entries(params[j])) {
                valueActual = value;
                if (key == 'id')
                    valueActual = `gen-${i+1}-${value}`;
                input[key] = valueActual;
            }
            for (const [key, value] of Object.entries(commonparams)) {
                input[key] = value;
            }
            td.appendChild(input);
            tr.appendChild(td);
        }
        inputTableBodyElement.appendChild(tr);
    }
}

function validateInput(input) {
    let powerDemand = input['powerDemand'];
    let numberGenerators = Number(input['numberGenerators']);
    let limits = input['limits'];
    let coeffs = input['coeffs'];
    let errors = [];
    if (isEmpty(powerDemand))
        errors.push("Empty input for Power demand");
    powerDemand = Number(powerDemand);
    if (Number.isNaN(powerDemand))
        errors.push('Invalid input for Power demand');
    // if (Number.isNaN(numberGenerators))
    //     errors.push('Invalid input for Number of generators');
    // if (!Number.isInteger(numberGenerators))
        // errors.push('Number of generators should be an integer');
    if (powerDemand < 0)
        errors.push('Power demand should be >= 0');
    if (numberGenerators <= 0)
        errors.push('Number of generators should be > 0');
    for (let i=0; i<numberGeneratorsGlobal; ++i) {
        if (isEmpty(limits[i][0]))
            errors.push(`Empty input for min limit of generator ${i+1}`);
        if (isEmpty(limits[i][1]))
            errors.push(`Empty input for max limit of generator ${i+1}`);
        let minLimit = Number(limits[i][0]), maxLimit = Number(limits[i][1]);
        if (Number.isNaN(minLimit))
            errors.push(`Invalid input for min limit of generator ${i+1}`);
        if (Number.isNaN(maxLimit))
            errors.push(`Invalid input for max limit of generator ${i+1}`);
        if (minLimit < 0)
            errors.push(`Min limit of generator ${i+1} should be greater than zero`);
        if (maxLimit < 0)
            errors.push(`Max limit of generator ${i+1} should be greater than zero`);
        if (maxLimit < minLimit)
            errors.push(`Max limit of generator ${i+1} should be greater than its min limit`);
        limits[i] = [minLimit, maxLimit];
    }
    for (let i=0; i<numberGeneratorsGlobal; ++i) {
        for (let j=0; j<coeffs[i].length; ++j) {
            let coeff = coeffs[i][j];
            if (isEmpty(coeff))
                errors.push(`Empty input for coefficient ${j+1} of generator ${i+1}`);
            coeff = Number(coeff);
            if (Number.isNaN(coeff))
                errors.push(`Invalid coefficient ${j+1} of generator ${i+1}`);
            if (coeff < 0)
                errors.push(`Coefficient ${j+1} of generator ${i+1} should be greater than zero`);
            coeffs[i][j] = coeff;
        }
    }
    input['powerDemand'] = powerDemand;
    input['numberGenerators'] = numberGenerators;
    input['limits'] = limits;
    input['coeffs'] = coeffs;
    input['errors'] = errors;
    input['valid'] = (errors.length==0 ? true:false);
    return input;
}

function getInput() {
    let powerDemand = document.getElementById('power-demand-input').value;
    // let numberGenerators = document.getElementById('number-generators-input').value;
    console.log(powerDemand, numberGeneratorsGlobal);
    let limits = [];
    let coeffs = [];
    for (let i=0; i<numberGeneratorsGlobal; ++i) {
        let minLimit = document.getElementById(`gen-${i+1}-min`).value;
        let maxLimit = document.getElementById(`gen-${i+1}-max`).value;

        let coeff1 = document.getElementById(`gen-${i+1}-coeff-1`).value;
        let coeff2 = document.getElementById(`gen-${i+1}-coeff-2`).value;
        let coeff3 = document.getElementById(`gen-${i+1}-coeff-3`).value;

        limits.push([minLimit, maxLimit]);
        coeffs.push([coeff1, coeff2, coeff3]);
    }
    return {
        'powerDemand': powerDemand,
        'numberGenerators': numberGeneratorsGlobal,
        'limits': limits,
        'coeffs': coeffs
    };
}

function showOutput(output) {
    let outputTableElement = document.getElementById('output-table');
    outputTableElement.style.visibility = 'visible';
    let outputTableBodyElement = document.getElementById('output-table-body');
    outputTableBodyElement.innerHTML = '';
    let outputTableFootElement = document.getElementById('output-table-foot');
    outputTableFootElement.innerHTML = '';

    let unitsOptimal = output['unitsOptimal'];
    let costDetailsOptimal = output['costDetailsOptimal'];
    let costsOptimal = costDetailsOptimal['costs'];
    let costDetailsEqual = output['costDetailsEqual'];
    let costsEqual = costDetailsEqual['costs'];

    for (let i=0; i<numberGeneratorsGlobal; ++i) {
        let tr = document.createElement('tr');
        let th = document.createElement('th');
        th.scope = 'row';
        th.textContent = i+1;
        tr.appendChild(th);

        let unitOptimal = unitsOptimal[i];
        let td1 = document.createElement('td');
        td1.textContent = roundValueToPDecimals(unitOptimal, 3);
        tr.appendChild(td1);

        let costOptimal = costsOptimal[i];
        let td2 = document.createElement('td');
        td2.textContent = roundValueToPDecimals(costOptimal, 3);
        tr.appendChild(td2);

        let costEqual = costsEqual[i];
        let td3 = document.createElement('td');
        td3.textContent = roundValueToPDecimals(costEqual, 3);
        tr.appendChild(td3);

        outputTableBodyElement.appendChild(tr);
    }

    let tr = document.createElement('tr');
    tr.className = "bg-info";

    let th = document.createElement('th');
    th.scope = 'row';
    th.textContent = "Sum";
    tr.appendChild(th);

    let td1 = document.createElement('td');
    tr.appendChild(td1);

    let costOptimalTotal = costDetailsOptimal['totalCost'];
    let td2 = document.createElement('td');
    td2.textContent = roundValueToPDecimals(costOptimalTotal, 3);
    tr.appendChild(td2);

    let costEqualTotal = costDetailsEqual['totalCost'];
    let td3 = document.createElement('td');
    td3.textContent = roundValueToPDecimals(costEqualTotal, 3);
    tr.appendChild(td3);

    outputTableFootElement.appendChild(tr);
}

function resetOutput() {
    document.getElementById('output-table').style.visibilty = 'hidden';
    hideErrorList();
}

function reset() {
    console.log("In reset");
    numberGeneratorsGlobal = 3;
    document.getElementById('number-generators-input').value = '';
    document.getElementById('power-demand-input').value = '';
    updateInputTable(numberGeneratorsGlobal);
    resetOutput();
}

function resetJSVariables() {
    powerDemand = 220;
    D = 2;
    coeffs = [[0, 40, 0.2/2], [0, 30, 0.25/2]];
    limits = [[0, Infinity], [0, Infinity]];
}

function showErrorList(errors) {
    let errorListDiv = document.getElementById('error-list-div');
    errorListDiv.style.display = 'block';
    let errorListElement = document.getElementById('error-list');
    errorListElement.innerHTML = '';
    for (let i=0; i<errors.length; ++i) {
        let li = document.createElement('li');
        li.className = "list-group-item list-group-item-danger";
        li.textContent = errors[i];
        errorListElement.appendChild(li);
    }
}

function hideErrorList() {
    let errorListDiv = document.getElementById('error-list-div');
    errorListDiv.style.display = 'none';
}

window.onload = () => {
    console.log("Hello JS");
}

function roundValueToPDecimals(x, p) {
    return (x).toFixed(p).replace(/[.,]000$/, "");
}

function isEmpty(str) {
    return !str.trim().length;
}