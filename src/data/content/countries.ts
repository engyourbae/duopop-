export interface Country { code: string; name: string }
export const countries: Country[] = [
  ['ID','Indonesia'],['MY','Malaysia'],['SG','Singapura'],['TH','Thailand'],['VN','Vietnam'],['PH','Filipina'],['JP','Jepang'],['KR','Korea Selatan'],
  ['CN','Tiongkok'],['IN','India'],['AU','Australia'],['NZ','Selandia Baru'],['GB','Inggris'],['FR','Prancis'],['DE','Jerman'],['IT','Italia'],
  ['ES','Spanyol'],['PT','Portugal'],['NL','Belanda'],['BR','Brasil'],['AR','Argentina'],['MX','Meksiko'],['CA','Kanada'],['US','Amerika Serikat'],
  ['EG','Mesir'],['ZA','Afrika Selatan'],['SA','Arab Saudi'],['TR','Turki'],['RU','Rusia'],['CH','Swiss'],['SE','Swedia'],['NO','Norwegia'],
  ['KE','Kenya'],['NG','Nigeria'],['PK','Pakistan'],['BD','Bangladesh'],['TL','Timor Leste'],['BN','Brunei'],['CL','Chile'],['CO','Kolombia'],
].map(([code, name]) => ({ code: code as string, name: name as string }));
export const flagEmoji = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
