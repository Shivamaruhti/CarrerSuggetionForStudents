const categories = new Set(["after10th", "intermediate", "graduation", "pg"]);
const entranceOptions = new Set(["Entrance Test", "Direct Joining"]);
const columns = [
  ["category", "Education Level"],
  ["previousStandard", "Previous Standard"],
  ["previousBranch", "Previous Branch"],
  ["nextStandard", "Next Level / Course"],
  ["duration", "Years of Course"],
  ["branch", "Branch / Course"],
  ["entranceTypes", "Entrance Type"],
  ["entranceTestName", "Entrance Test Name"],
  ["eligibility", "Eligibility"],
  ["institution", "Institution / College"],
  ["fees", "Fees"],
  ["careerOptions", "Career Options"],
  ["description", "Description"],
];
const aliases = {
  category: ["educationlevel", "category", "educationcategory", "educationtype"],
  previousStandard: ["previousstandard", "previouslevel", "previouscourse"],
  previousBranch: ["previousbranch"],
  nextStandard: ["nextlevel", "nextlevelcourse", "nextstandard", "standard", "course", "coursestream", "graduation"],
  duration: ["yearsofcourse", "duration", "courseyears", "courseyear", "coursetime"],
  branch: ["branchcourse", "branch", "branchname", "specialization"],
  entranceTypes: ["entrancetype", "entrancetypes", "admissiontype", "entrancetype"],
  entranceTestName: ["entrancetestname", "entacetestname", "entancetestname", "testname"],
  eligibility: ["eligibility", "eligibilitycriteria"],
  institution: ["institutioncollege", "institution", "college"],
  fees: ["fees", "coursefees"],
  careerOptions: ["careeroptions", "careerpaths"],
  description: ["description", "details"],
};

function normalizeHeader(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellText(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("text" in value) return String(value.text);
    if ("result" in value) return String(value.result ?? "");
    if ("richText" in value) return value.richText.map((item) => item.text).join("");
    return "";
  }
  return String(value).trim();
}

function resolveColumn(headers, field, previousStandardIndex) {
  const candidates = aliases[field];
  const indexes = headers
    .map((header, index) => candidates.includes(normalizeHeader(header)) ? index : -1)
    .filter((index) => index >= 0);

  if (field === "previousBranch") {
    const explicit = indexes.find((index) => ["previousbranch", "previouscourse"].includes(normalizeHeader(headers[index])));
    if (explicit != null) return explicit;
    const branchIndexes = headers
      .map((header, index) => normalizeHeader(header) === "branch" ? index : -1)
      .filter((index) => index >= 0);
    return previousStandardIndex >= 0 && branchIndexes.length > 1 ? branchIndexes[0] : -1;
  }
  if (field === "branch") {
    const explicit = indexes.filter((index) =>
      ["branchcourse", "branchname", "specialization"].includes(normalizeHeader(headers[index])));
    if (explicit.length) return explicit[explicit.length - 1];
    return indexes.length ? indexes[indexes.length - 1] : -1;
  }
  return indexes.length ? indexes[0] : -1;
}

function normalizeCategory(value) {
  const category = normalizeHeader(value);
  if (category.startsWith("after10")) return "after10th";
  if (category.startsWith("graduate") || category.startsWith("graduation")) return "graduation";
  if (category === "pg" || category.startsWith("postgrad")) return "pg";
  return "";
}

function normalizeEntranceType(value) {
  const entranceType = value.trim().toLowerCase();
  if (["entrance test", "entrance", "yes", "true", "1", "checked"].includes(entranceType)) return "Entrance Test";
  if (entranceType === "direct joining") return "Direct Joining";
  return value.trim();
}

function checked(value) {
  return ["yes", "true", "1", "checked", "x"].includes(value.trim().toLowerCase());
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (insideQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.trim() === "") {
      field = "";
      insideQuotes = true;
    } else if (character === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (character === "\n" || character === "\r") {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (insideQuotes) throw new Error("The CSV file contains an unclosed quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function findHeaderRow(rows) {
  const requiredFields = ["nextStandard", "duration", "branch"];
  let best = null;

  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 5); rowIndex += 1) {
    const headers = rows[rowIndex].map(cellText);
    const score = Object.keys(aliases).reduce(
      (total, field) => total + (resolveColumn(headers, field, -1) >= 0 ? 1 : 0),
      0,
    );
    const hasRequiredFields = requiredFields.every((field) =>
      resolveColumn(headers, field, -1) >= 0);
    if (hasRequiredFields && (!best || score > best.score)) {
      best = { headers, rowIndex, score };
    }
  }

  if (!best) {
    throw new Error("Could not recognize the course columns in this CSV. Check the header row or download the matching CSV template.");
  }
  return best;
}

function categoryFromHeaders(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);
  if (normalizedHeaders.includes("previouscourse") || normalizedHeaders.includes("coursetime")) return "pg";
  if (normalizedHeaders.includes("previousstandard") || normalizedHeaders.includes("courseyears")) return "graduation";
  if (normalizedHeaders.includes("courseyear")) return "after10th";
  return "";
}

export async function readEducationCsv(file, defaultCategory = "") {
  const text = (await file.text()).replace(/^\uFEFF/, "");
  const delimiters = [",", ";", "\t", "|"];
  const candidates = delimiters.map((delimiter) => {
    const rows = parseCsv(text, delimiter);
    try {
      const header = findHeaderRow(rows);
      return { rows, ...header };
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (!candidates.length) {
    throw new Error("Could not recognize the course columns in this CSV. Check the header row or download the matching CSV template.");
  }
  const { rows, headers, rowIndex: headerRowIndex } = candidates.sort(
    (first, second) => second.score - first.score,
  )[0];
  if (rows.length - headerRowIndex - 1 > 500) throw new Error("Import up to 500 courses at a time.");
  const records = [];
  const previousStandardIndex = headers.findIndex((header) =>
    aliases.previousStandard.includes(normalizeHeader(header)));
  const entranceTestIndex = headers.findIndex((header) => ["entrancetest", "entrancetests"].includes(normalizeHeader(header)));
  const directJoiningIndex = headers.findIndex((header) => ["directjoining", "directlyjoining"].includes(normalizeHeader(header)));
  const categoryFromFile = normalizeCategory(file.name);
  const categoryFromSchema = categoryFromHeaders(headers);

  rows.slice(headerRowIndex + 1).forEach((values, index) => {
    if (!values.some((value) => cellText(value))) return;
    const record = {};
    for (const [field] of columns) {
      const columnIndex = resolveColumn(headers, field, previousStandardIndex);
      record[field] = columnIndex < 0 ? "" : cellText(values[columnIndex]);
    }

    record.category = normalizeCategory(record.category) || categoryFromFile || categoryFromSchema || defaultCategory;
    record.entranceTypes = record.entranceTypes
      .split(/[,;\n|]/)
      .map(normalizeEntranceType)
      .filter(Boolean);
    if (entranceTestIndex >= 0 && checked(cellText(values[entranceTestIndex]))
        && !record.entranceTypes.includes("Entrance Test")) {
      record.entranceTypes.push("Entrance Test");
    }
    if (directJoiningIndex >= 0 && checked(cellText(values[directJoiningIndex]))
        && !record.entranceTypes.includes("Direct Joining")) {
      record.entranceTypes.push("Direct Joining");
    }
    if (/^\d+(?:\.\d+)?$/.test(record.duration)) {
      record.duration = `${record.duration} ${record.duration === "1" ? "year" : "years"}`;
    }
    const errors = [];
    if (!categories.has(record.category)) errors.push("Education Level must be after10th, intermediate, graduation, or pg.");
    if (!record.nextStandard) errors.push("Next Level / Course is required.");
    if (!record.duration) errors.push("Years of Course is required.");
    if (!record.branch) errors.push("Branch / Course is required.");
    const previousLimit = record.category === "pg" ? 50 : record.category === "graduation" ? 100 : 0;
    const courseLimit = record.category === "after10th" || record.category === "pg" ? 50 : 100;
    const branchLimit = record.category === "after10th" ? 70 : record.category === "pg" ? 50 : 100;
    const optionLimit = record.category === "graduation" ? 100 : 50;
    if (previousLimit && record.previousStandard.length > previousLimit) errors.push(`Previous Standard must be ${previousLimit} characters or fewer.`);
    if (previousLimit && record.previousBranch.length > previousLimit) errors.push(`Previous Branch must be ${previousLimit} characters or fewer.`);
    if (record.nextStandard.length > courseLimit) errors.push(`Standard must be ${courseLimit} characters or fewer.`);
    if (record.duration.length > courseLimit) errors.push(`Course duration must be ${courseLimit} characters or fewer.`);
    if (record.branch.length > branchLimit) errors.push(`Branch must be ${branchLimit} characters or fewer.`);
    if (record.entranceTypes.join(", ").length > optionLimit) errors.push(`Entrance type must be ${optionLimit} characters or fewer.`);
    if (record.entranceTestName.length > optionLimit) errors.push(`Test name must be ${optionLimit} characters or fewer.`);
    if (record.eligibility.length > 200) errors.push("Eligibility must be 200 characters or fewer.");
    if (record.institution.length > 200) errors.push("Institution / College must be 200 characters or fewer.");
    if (record.entranceTypes.some((type) => !entranceOptions.has(type))) {
      errors.push("Entrance Type must be Entrance Test, Direct Joining, or both.");
    }
    if (record.entranceTypes.includes("Entrance Test") && !record.entranceTestName) {
      errors.push("Entrance Test Name is required when Entrance Test is selected.");
    }
    if (record.fees && (!Number.isFinite(Number(record.fees)) || Number(record.fees) < 0)) {
      errors.push("Fees must be a non-negative number.");
    }
    record.fees = record.fees ? Number(record.fees) : null;
    record.rowNumber = index + headerRowIndex + 2;
    record.errors = errors;
    records.push(record);
  });

  if (!records.length) throw new Error("No course records were found below the header row.");
  return records;
}
