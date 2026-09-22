// Display publication and revision dates separately; never fabricate a first publication.
function displayDate(item) {
  const value = item.updated_at || (item.date_verified === false ? '' : item.date);
  if (!value) return {date:'',label:''};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value) throw Error('Data editoriale non valida');
  return {date:value,label:(item.updated_at?'Aggiornato il ':'')+new Date(value+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})};
}
function schemaDates(item) {
  displayDate(item);
  return (item.date && item.date_verified !== false ? `"datePublished": ${JSON.stringify(item.date)},` : '') +
    (item.updated_at ? `"dateModified": ${JSON.stringify(item.updated_at)},` : '');
}
module.exports={displayDate,schemaDates};
