
function extractRuneData(perks){
    const primaryStyle = perks.styles.find(s => s.description === 'primaryStyle');
    const secondaryStyle = perks.styles.find(s => s.description === 'subStyle');
    const statPerks = perks.statPerks
    
    if(!primaryStyle || !secondaryStyle || !statPerks){
        return null
    }

    return {
        primary: {
            styleId: primaryStyle.style,
            perks: primaryStyle.selections.map(s => s.perk)
        },
        secondary:{
            styleId: secondaryStyle.style,
            perks: secondaryStyle.selections.map(s => s.perk)
        },
        stats:{
            perks:[
                perks.statPerks.defense,
                perks.statPerks.flex,
                perks.statPerks.offense
            ]
        }
    }
}

module.exports = {extractRuneData}