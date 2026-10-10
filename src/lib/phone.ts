import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";

const countryCodes: Record<string, CountryCode> = {
  "Côte d'Ivoire": "CI",
  "Bénin": "BJ",
  "Burkina Faso": "BF",
  "Cameroun": "CM",
  "Cap-Vert": "CV",
  "Centrafrique": "CF",
  "Comores": "KM",
  "Congo": "CG",
  "RD Congo": "CD",
  "Gabon": "GA",
  "Gambie": "GM",
  "Ghana": "GH",
  "Guinée": "GN",
  "Guinée-Bissau": "GW",
  "Guinée équatoriale": "GQ",
  "Liberia": "LR",
  "Mali": "ML",
  "Mauritanie": "MR",
  "Niger": "NE",
  "Nigeria": "NG",
  "Sénégal": "SN",
  "Sierra Leone": "SL",
  "Tchad": "TD",
  "Togo": "TG",
  "Algérie": "DZ",
  "Maroc": "MA",
  "Tunisie": "TN",
  "France": "FR",
  "Belgique": "BE",
  "Suisse": "CH",
  "Canada": "CA",
};

/** Returns the valid international E.164 representation, or null if invalid. */
export function normalizePhoneNumber(value: string, country?: string): string | null {
  const input = value.trim();
  if (!input || input.length > 40 || !/^\+?[0-9().\s-]+$/.test(input)) return null;

  const defaultCountry = countryCodes[country ?? "Côte d'Ivoire"];
  const phoneNumber = parsePhoneNumberFromString(
    input,
    defaultCountry ? { defaultCountry, extract: false } : { extract: false },
  );

  return phoneNumber?.isValid() ? phoneNumber.number : null;
}

export function phoneValidationMessage(value: string, country?: string): string | null {
  if (!value.trim()) return "Le numéro de téléphone est obligatoire.";
  if (!normalizePhoneNumber(value, country)) return "Veuillez saisir un numéro de téléphone valide.";
  return null;
}
