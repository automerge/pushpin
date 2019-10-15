import freezeDry from 'freeze-dry'

window.addEventListener('load', onLoad)

async function onLoad() {
  window.removeEventListener('load', onLoad)
  const html = await freezeDry(document)

  alert(`freeze-dry done! ${html.slice(0, 50)}`) // eslint-disable-line
}
