import _ from 'lodash'

function deleteNumbers (text) {
    return text.replace(/\d+/, '')
}

function removeQuotes (s) {
    let n = s.length
    if (s[0] === '"' && s[n - 1] === '"') {
        return s.slice(1, n - 1)
    }
    if (s[0] === "'" && s[n - 1] === "'") {
        return s.slice(1, n - 1)
    }
    return s
}

class PdbParser {
    constructor (soup) {
        this.soup = soup
        this.hasSecondaryStructure = false
        this.error = ''
    }

    isAtomLine (line) {
        return line.substr(0, 4) === 'ATOM' || line.substr(0, 6) === 'HETATM'
    }

    isNmr (lines) {
        for (let line of lines) {
            if (line.startsWith('EXPDTA')) {
                if (line.includes('NMR')) {
                    return true
                }
            }
        }
        return false
    }

    parseAtomLines (pdbLines) {
        let x, y, z, chain, resType
        let atomType, bfactor, elem, alt, resNum, insCode

        for (let iLine = 0; iLine < pdbLines.length; iLine += 1) {
            let line = pdbLines[iLine]

            if (this.isAtomLine(line)) {
                try {
                    atomType = _.trim(line.substr(12, 4))
                    alt = _.trim(line.substr(16, 1))
                    resType = _.trim(line.substr(17, 3))
                    chain = line[21]
                    resNum = parseInt(line.substr(22, 4))
                    insCode = line.substr(26, 1)
                    x = parseFloat(line.substr(30, 7))
                    y = parseFloat(line.substr(38, 7))
                    z = parseFloat(line.substr(46, 7))
                    bfactor = parseFloat(line.substr(60, 6))
                    elem = deleteNumbers(_.trim(line.substr(76, 2)))
                } catch (e) {
                    this.error = 'line ' + iLine
                    console.log(`parseAtomLines: "${line}"`)
                    continue
                }

                if (elem === '') {
                    elem = deleteNumbers(_.trim(atomType)).substr(0, 1)
                }

                this.soup.addAtom(
                    x,
                    y,
                    z,
                    bfactor,
                    alt,
                    atomType,
                    elem,
                    resType,
                    resNum,
                    insCode,
                    chain
                )
            }
        }
    }

    parseSecondaryStructureLines (pdbLines) {
        this.soup.assignResidueProperties(this.soup.iStructure)
        let residue = this.soup.getResidueProxy()
        for (let iLine = 0; iLine < pdbLines.length; iLine += 1) {
            let line = pdbLines[iLine]

            if (line.substr(0, 5) === 'HELIX') {
                this.hasSecondaryStructure = true
                let chain = line.substr(19, 1)
                let resNumStart = parseInt(line.substr(21, 4))
                let resNumEnd = parseInt(line.substr(33, 4))
                for (let iRes of this.soup.findResidueIndices(
                    this.soup.iStructure,
                    chain,
                    resNumStart
                )) {
                    residue.iRes = iRes
                    while (
                        residue.resNum <= resNumEnd &&
                        chain === residue.chain
                    ) {
                        residue.ss = 'H'
                        residue.iRes = residue.iRes + 1
                    }
                }
            } else if (line.substr(0, 5) === 'SHEET') {
                this.hasSecondaryStructure = true
                let chain = line.substr(21, 1)
                let resNumStart = parseInt(line.substr(22, 4))
                let resNumEnd = parseInt(line.substr(33, 4))
                for (let iRes of this.soup.findResidueIndices(
                    this.soup.iStructure,
                    chain,
                    resNumStart
                )) {
                    residue.iRes = iRes
                    while (
                        residue.resNum <= resNumEnd &&
                        chain === residue.chain
                    ) {
                        residue.ss = 'E'
                        residue.iRes = residue.iRes + 1
                    }
                }
            }
        }
    }

    parseTitle (lines) {
        let result = ''
        for (let line of lines) {
            if (line.substring(0, 5) === 'TITLE') {
                result += line.substring(10)
            }
        }
        return result
    }

    parsePdbData (pdbText, pdbId) {
        let lines = pdbText.split(/\r?\n/)
        if (lines.length === 0) {
            this.parsingError = 'No atom lines'
            return
        }

        let title = this.parseTitle(lines)

        let isNmr = this.isNmr(lines)

        let models = [[]]
        let iModel = 0
        for (let line of lines) {
            if (this.isAtomLine(line)) {
                models[iModel].push(line)
            } else if (line.substr(0, 3) === 'END') {
                if (isNmr) {
                    break
                }
                models.push([])
                iModel += 1
            }
        }

        if (models[iModel].length === 0) {
            models.pop()
        }

        let nModel = models.length
        for (let iModel = 0; iModel < nModel; iModel += 1) {
            let structureId = pdbId
            if (nModel > 1) {
                structureId = `${structureId}[${iModel + 1}]`
            }
            this.soup.pushStructureId(structureId, title)
            this.parseAtomLines(models[iModel])
            this.parseSecondaryStructureLines(lines)
        }
    }
}

class CifParser {
    constructor (soup) {
        this.soup = soup
        this.hasSecondaryStructure = false
        this.error = ''
    }

    isAtomLine (line) {
        return line.substr(0, 4) === 'ATOM' || line.substr(0, 6) === 'HETATM'
    }

    parseAtomLines (pdbLines) {
        let x, y, z, chain, resType, entity
        let atomType, bfactor, elem, alt, resNum, insCode
        let nextResNum = null
        let lastChain = null
        let lastEntity = null
        let token
        for (let iLine = 0; iLine < pdbLines.length; iLine += 1) {
            let line = pdbLines[iLine]

            if (this.isAtomLine(line)) {
                let tokens = line.split(/[ ,]+/)
                try {
                    elem = tokens[2]
                    atomType = removeQuotes(tokens[3])
                    alt = tokens[4] === '.' ? '' : tokens[4]
                    resType = tokens[5]
                    chain = tokens[6]
                    entity = tokens[7]
                    insCode = tokens[9] === '?' ? '' : tokens[9]
                    x = parseFloat(tokens[10])
                    y = parseFloat(tokens[11])
                    z = parseFloat(tokens[12])
                    bfactor = parseFloat(tokens[14])
                    token = tokens[8]
                    if (token === '.') {
                        let isSameChainAndEntity =
                            chain === lastChain && entity === lastEntity
                        if (!isSameChainAndEntity || resType === 'HOH') {
                            nextResNum += 1
                            lastChain = chain
                            lastEntity = entity
                        }
                        resNum = nextResNum
                    } else {
                        resNum = parseInt(tokens[16])
                        lastChain = chain
                        lastEntity = entity
                        nextResNum = resNum + 1
                    }
                    // console.log({
                    //   atomType,
                    //   alt,
                    //   resType,
                    //   chain,
                    //   resNum,
                    //   insCode,
                    //   x,
                    //   y,
                    //   z,
                    //   bfactor,
                    //   elem
                    // })
                } catch (e) {
                    this.error = 'line ' + iLine
                    console.log(`parseAtomLines ${e}: "${line}"`)
                    continue
                }

                if (elem === '') {
                    elem = deleteNumbers(_.trim(atomType)).substr(0, 1)
                }

                this.soup.addAtom(
                    x,
                    y,
                    z,
                    bfactor,
                    alt,
                    atomType,
                    elem,
                    resType,
                    resNum,
                    insCode,
                    chain
                )
            }
        }
    }

    parseSecondaryStructureLines (pdbLines) {
        this.hasSecondaryStructure = false
        this.soup.assignResidueProperties(this.soup.iStructure)
        this.parseHelixLines(pdbLines)
        this.parseSheetLines(pdbLines)
    }

    parseHelixLines (pdbLines) {
        console.log('CifParser.parseHelixLines')
        let residue = this.soup.getResidueProxy()
        let isHelixLoop = false
        for (let iLine = 0; iLine < pdbLines.length; iLine += 1) {
            let line = pdbLines[iLine]
            if (!isHelixLoop) {
                if (_.startsWith(line, '_struct_conf.pdbx_PDB_helix_id')) {
                    isHelixLoop = true
                }
            }
            if (!isHelixLoop) {
                continue
            }
            if (_.startsWith(line, '#')) {
                break
            }
            if (!_.startsWith(line, '_struct_conf')) {
                this.hasSecondaryStructure = true
                let tokens = line.split(/[ ,]+/)
                let chain = tokens[4]
                let resNumStart = parseInt(tokens[5])
                let resNumEnd = parseInt(tokens[9])
                for (let iRes of this.soup.findResidueIndices(
                    this.soup.iStructure,
                    chain,
                    resNumStart
                )) {
                    residue.iRes = iRes
                    while (
                        residue.resNum <= resNumEnd &&
                        chain === residue.chain
                    ) {
                        residue.ss = 'H'
                        residue.iRes = residue.iRes + 1
                    }
                }
            }
        }
    }

    parseSheetLines (pdbLines) {
        console.log('CifParser.parseSheetLines')
        let residue = this.soup.getResidueProxy()
        let isSheetLoop = false
        for (let iLine = 0; iLine < pdbLines.length; iLine += 1) {
            let line = pdbLines[iLine]
            if (!isSheetLoop) {
                if (_.startsWith(line, '_struct_sheet_range.sheet_id')) {
                    isSheetLoop = true
                }
            }
            if (!isSheetLoop) {
                continue
            }
            if (_.startsWith(line, '#')) {
                break
            }
            if (line.substr(0, 6) !== '_struct') {
                this.hasSecondaryStructure = true
                let tokens = line.split(/[ ,]+/)
                let chain = tokens[3]
                let resNumStart = parseInt(tokens[4])
                let resNumEnd = parseInt(tokens[8])
                for (let iRes of this.soup.findResidueIndices(
                    this.soup.iStructure,
                    chain,
                    resNumStart
                )) {
                    residue.iRes = iRes
                    while (
                        residue.resNum <= resNumEnd &&
                        chain === residue.chain
                    ) {
                        residue.ss = 'E'
                        residue.iRes = residue.iRes + 1
                    }
                }
            }
        }
    }

    parseTitle (lines) {
        for (let i = 0; i < lines.length; i += 1) {
            let line = lines[i]
            if (line.startsWith('_struct.title')) {
                let rest = _.trim(line.replace('_struct.title', ''))
                if (rest) {
                    return removeQuotes(_.trim(rest))
                }
            }
            if (i > 0) {
                let prevLine = lines[i - 1]
                if (_.startsWith(prevLine, '_struct.title')) {
                    return removeQuotes(_.trim(line))
                }
            }
        }
        return ''
    }

    parsePdbData (pdbText, pdbId) {
        let lines = pdbText.split(/\r?\n/)
        if (lines.length === 0) {
            this.parsingError = 'No atom lines'
            return
        }
        this.soup.pushStructureId(pdbId, this.parseTitle(lines))
        this.parseAtomLines(lines)
        this.parseSecondaryStructureLines(lines)
    }
}

export { PdbParser, CifParser }
