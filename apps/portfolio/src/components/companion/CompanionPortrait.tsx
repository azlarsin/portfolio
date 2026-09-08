import { useId } from 'react'

/** A layered vector portrait, with proportions and the wafer pose drawn from the references. */
export function CompanionPortrait() {
  const id = useId().replace(/:/g, '')
  const skin = `${id}-skin`
  const cheek = `${id}-cheek`
  const hair = `${id}-hair`
  const hairCrop = `${id}-hair-crop`
  const cape = `${id}-cape`
  const shirt = `${id}-shirt`
  const crop = `${id}-crop`
  const mouth = `${id}-mouth`
  const crown = Array.from({ length: 77 }, (_, i) => {
    const angle = Math.PI - (i / 76) * Math.PI
    const tip = i % 2 === 0 ? 1.3 + Math.sin(i * 2.7) * 1.1 : -0.7
    const x = 159 + Math.cos(angle) * (69 + tip)
    const y = 96 - Math.sin(angle) * (71 + tip)
    return `L${x.toFixed(2)} ${y.toFixed(2)}`
  }).join('')
  const hairline = `M95 157L91 143L90 128L90 112L90 96${crown}L229 112L225 131L220 155L219 126L216 104L213 87L208 89L208 81L202 87L202 79L195 84L195 77L187 82L188 75L180 82L180 75L172 83L173 76L166 84L166 77L158 86L159 78L151 87L152 81L143 91L145 83L137 92L138 86L130 94L132 87L123 98L125 91L117 102L119 95L112 106L114 100L107 112L105 123L101 137L101 157Z`

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="companion-portrait"
      viewBox="0 0 320 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={skin} x1="105" y1="103" x2="220" y2="225" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD095" />
          <stop offset="0.42" stopColor="#F7B577" />
          <stop offset="0.82" stopColor="#ECA066" />
          <stop offset="1" stopColor="#DA8C57" />
        </linearGradient>
        <radialGradient id={cheek} cx="0.4" cy="0.35" r="0.65">
          <stop stopColor="#FFDFA8" stopOpacity="0.65" />
          <stop offset="1" stopColor="#FFDFA8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={hair} x1="116" y1="50" x2="227" y2="98" gradientUnits="userSpaceOnUse">
          <stop stopColor="#25231F" />
          <stop offset="0.62" stopColor="#22231F" />
          <stop offset="1" stopColor="#4B4A3F" />
        </linearGradient>
        <linearGradient id={cape} x1="94" y1="242" x2="252" y2="336" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFCF2" />
          <stop offset="0.48" stopColor="#FFF5E4" />
          <stop offset="1" stopColor="#EAD8BF" />
        </linearGradient>
        <linearGradient id={shirt} x1="116" y1="249" x2="179" y2="341" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7CE28" />
          <stop offset="0.62" stopColor="#EFC01D" />
          <stop offset="1" stopColor="#DFAE17" />
        </linearGradient>
        <linearGradient id={mouth} x1="157" y1="194" x2="158" y2="224" gradientUnits="userSpaceOnUse">
          <stop stopColor="#482419" />
          <stop offset="0.45" stopColor="#753324" />
          <stop offset="1" stopColor="#AC513B" />
        </linearGradient>
        <clipPath id={crop}><path d="M0 0H320V331Q160 348 0 331Z" /></clipPath>
        <clipPath id={hairCrop}><path d={hairline} /></clipPath>
      </defs>

      <g clipPath={`url(#${crop})`} strokeLinecap="round" strokeLinejoin="round">
        <g className="companion-body">
          {/* A real towel sits over broad shoulders, with a visible neck above it. */}
          <path d="M70 274C88 249 118 239 145 239C180 237 221 248 243 279L264 344H49Z" fill={`url(#${shirt})`} stroke="#A78424" strokeWidth="1.15" />
          <path d="M136 224L132 249C134 265 145 277 162 281C178 275 191 261 190 248L185 221Z" fill={`url(#${skin})`} stroke="#BB7B4D" strokeWidth="1" />
          <path d="M138 228C151 243 169 246 186 228L189 245C171 257 151 254 134 240Z" fill="#BD7346" opacity="0.35" />
          <path d="M127 247C131 267 145 281 161 290C179 280 193 264 195 248L204 254C199 276 182 294 162 306C141 294 123 277 119 257Z" fill="#123F61" />
          <path d="M129 257C136 276 148 286 162 295C177 285 189 272 195 256" stroke="#F6CF38" strokeWidth="3" />
          <path d="M83 304L78 340M224 300L235 341M120 334C139 338 154 339 172 337" stroke="#C2981A" strokeWidth="1" />
          <g opacity="0.88" transform="translate(199 311)" stroke="#376047" strokeWidth="1">
            <path d="M0-6C-7-14-15-15-19-14C-16-7-10-2-2 0M2-6C8-14 16-15 20-14C17-7 10-2 4 0" fill="#74895B" />
            <circle cx="1" cy="0" r="7" fill="#F8F2D1" />
            <path d="M1-4L5-1L3 3H-1L-3-1Z" fill="#345842" />
          </g>

          <g className="companion-cape">
            <path d="M132 247C120 237 95 242 80 252C66 265 58 292 48 313L33 342L94 350C104 321 116 295 137 267Z" fill={`url(#${cape})`} stroke="#CFBBA0" strokeWidth="1.05" />
            <path d="M187 243C211 241 237 251 251 272C262 293 266 321 273 344L240 350C223 315 203 282 141 267Z" fill={`url(#${cape})`} stroke="#CDB89B" strokeWidth="1.05" />
            <path d="M88 254C103 249 119 253 129 261C99 272 82 296 64 324M129 266C114 287 103 311 96 335" stroke="#DFCBB0" strokeWidth="1.7" />
            <path d="M121 260C98 278 80 307 70 335M100 281C90 306 85 322 83 331" stroke="#FFFEF7" strokeWidth="5" />
            <path d="M82 268C76 287 68 307 57 327" stroke="#E7D8C1" strokeWidth="1.2" />
            <path d="M151 261C182 252 210 257 234 274M151 271C190 281 220 314 237 342" stroke="#DECAAE" strokeWidth="1.7" />
            <path d="M166 265C198 268 226 284 242 306M189 280C219 298 231 320 239 338" stroke="#FFFCF2" strokeWidth="5" />
            <path d="M227 271C243 290 248 311 253 333M211 277C232 295 239 318 247 338" stroke="#E6D4BB" strokeWidth="1.3" />
            {/* Unequal towel loops and a low knot, rather than a costume bow. */}
            <path d="M134 263C118 248 97 251 96 267C96 279 114 282 131 271C116 278 108 292 115 302C126 310 146 293 141 273C159 281 174 271 169 260C163 251 146 255 137 261Z" fill="#FFF9EB" stroke="#CDBB9F" strokeWidth="1.1" />
            <path d="M102 266C111 259 125 265 132 267M119 297C127 291 130 281 132 275M144 263C151 260 159 263 163 266" stroke="#DED0B9" strokeWidth="1.6" />
            <path d="M131 261C136 256 143 259 146 265L143 275C136 280 128 273 129 267Z" fill="#EDE1CB" stroke="#C4AF90" strokeWidth="1" />
            <path d="M135 264L136 271" stroke="#FFFCF3" strokeWidth="2.2" />
          </g>
        </g>

        <g className="companion-head">
          <path d="M98 145C87 134 82 145 86 160C88 174 94 182 102 180L105 160Z" fill={`url(#${skin})`} stroke="#AA714C" strokeWidth="1.1" />
          <path d="M92 148C87 146 90 162 96 168L97 157" stroke="#C48050" strokeWidth="1.5" />
          <path d="M222 144C236 130 243 142 238 157C235 174 227 184 217 182L215 163Z" fill={`url(#${skin})`} stroke="#A97148" strokeWidth="1.1" />
          <path d="M225 151C231 141 239 144 231 160L224 170C228 160 229 155 224 155" fill="#E69159" stroke="#C17D4D" strokeWidth="1" />
          <path d="M228 145C231 141 235 143 235 147" stroke="#FFDBA2" strokeWidth="2" />

          <path d="M97 110C96 75 120 51 158 49C198 47 224 73 224 110L222 156C220 185 208 214 184 235C172 245 157 246 144 240C122 227 105 205 99 180C94 159 94 131 97 110Z" fill={`url(#${skin})`} stroke="#A8764E" strokeWidth="1.15" />
          <path d="M213 112C218 151 210 188 196 212C188 226 176 237 165 243C184 244 209 220 218 192C227 166 227 137 222 113Z" fill="#BE7947" opacity="0.19" />
          <ellipse cx="127" cy="174" rx="26" ry="33" fill={`url(#${cheek})`} />
          <ellipse cx="185" cy="172" rx="24" ry="28" fill={`url(#${cheek})`} opacity="0.58" />
          <path d="M103 119C99 140 100 161 104 172" stroke="#FFDEA5" strokeWidth="2" opacity="0.55" />
          <path d="M120 186C121 198 124 204 129 209M199 182C200 192 195 202 190 207" stroke="#D98C54" strokeWidth="1.1" opacity="0.33" />

          <path d={hairline} fill={`url(#${hair})`} stroke="#262720" strokeWidth="0.9" />
          <g clipPath={`url(#${hairCrop})`}>
            {/* Short directional strands break up the crop without forming long bangs. */}
            {Array.from({ length: 145 }, (_, i) => {
              const row = Math.floor(i / 29)
              const column = i % 29
              const x = 87 + column * 5.2 + Math.sin(i * 1.7) * 2.4
              const y = 34 + row * 14 + Math.sin(i * 2.1) * 6
              const length = 5 + (i % 6) * 1.05
              return <path key={i} d={`M${x} ${y + length}Q${x + 2} ${y + 4} ${x + 3 + (i % 3)} ${y}`} stroke={x > 195 && i % 3 === 0 ? '#9C9D88' : i % 4 === 0 ? '#676352' : '#414239'} strokeWidth={i % 4 === 0 ? '0.75' : '0.55'} opacity={x > 195 ? '0.7' : '0.63'} />
            })}
            <path d="M92 140L99 119M95 130L102 111M222 139L225 118M221 125L225 103" stroke="#71715D" strokeWidth="0.8" opacity="0.6" />
          </g>

          {/* Gently arched brows and smaller almond eyes preserve the reference proportions. */}
          <path d="M112 126C119 115 132 113 142 120L144 124C132 120 122 120 112 126Z" fill="#53402E" />
          <path d="M172 119C182 112 195 115 202 125L204 130C195 123 184 120 172 123Z" fill="#51412E" />
          <path d="M115 123C123 117 133 117 138 120M176 120C185 116 194 120 199 124" stroke="#816244" strokeWidth="0.65" />
          <path d="M114 138C122 132 134 131 143 138M172 137C181 130 194 133 202 142" stroke="#D0935F" strokeWidth="1" opacity="0.75" />
          <g className="companion-eyes">
            <path d="M113 145C120 135 135 134 143 144C136 154 121 155 113 145Z" fill="#FFF8E9" stroke="#936443" strokeWidth="0.8" />
            <path d="M172 144C181 134 194 137 203 147C195 155 180 155 172 144Z" fill="#FFF8E9" stroke="#936443" strokeWidth="0.8" />
            <g className="companion-pupils">
              <ellipse cx="130" cy="144.5" rx="8.9" ry="9.4" fill="#68432B" stroke="#463122" strokeWidth="0.9" />
              <ellipse cx="187" cy="145" rx="8.8" ry="9.5" fill="#674129" stroke="#423022" strokeWidth="0.9" />
              <ellipse cx="131" cy="144.5" rx="5.1" ry="6.5" fill="#24211B" />
              <ellipse cx="187.5" cy="145" rx="5.1" ry="6.5" fill="#24211B" />
              <path d="M125 151Q129 154 135 150M182 151Q187 154 192 151" stroke="#AB7543" strokeWidth="1.1" />
              <ellipse cx="126.8" cy="140" rx="2.5" ry="2.8" fill="#FFFFF3" />
              <ellipse cx="183.9" cy="140.5" rx="2.5" ry="2.7" fill="#FFFFF3" />
              <circle cx="134" cy="148" r="1.15" fill="#FFF4D8" />
              <circle cx="191" cy="148.6" r="1.15" fill="#FFF4D8" />
            </g>
            <path d="M113 145C120 135 135 134 143 144M172 144C181 134 194 137 203 147" stroke="#483024" strokeWidth="2" />
            <path d="M114 148C123 156 135 154 141 149M175 149C184 156 195 155 201 149" stroke="#DB9D68" strokeWidth="1" />
          </g>

          {/* The low bridge, wider nose tip and nostrils are shaded rather than outlined. */}
          <path d="M153 148C154 159 149 167 147 173C145 178 148 181 152 181" stroke="#CB8755" strokeWidth="1.1" />
          <path d="M166 151C165 161 169 168 172 174C174 178 171 182 167 182" stroke="#CB8755" strokeWidth="1.05" opacity="0.76" />
          <path d="M148 174C150 171 154 174 155 178C159 181 163 181 166 177C168 175 171 176 172 179C169 184 166 184 163 182C158 185 152 182 148 179Z" fill="#DF955D" opacity="0.6" />
          <path d="M148 178C150 175 153 176 155 180M165 180C167 177 170 177 171 180" stroke="#8A5232" strokeWidth="1.25" />
          <ellipse cx="158" cy="174" rx="5.5" ry="3.3" fill="#FFD99A" opacity="0.62" />
          <path d="M160 162L159 166" stroke="#FFDCA0" strokeWidth="2.1" opacity="0.65" />
          <path d="M157 186L156 190M163 187L164 190" stroke="#D48D56" strokeWidth="0.8" />

          {/* The open, curious expression and bitten wafer echo photo 4. */}
          <path d="M140 201C141 193 150 190 158 192C167 190 178 195 179 204C180 216 170 229 159 229C148 230 139 215 140 201Z" fill={`url(#mouth})`} stroke="#A26642" strokeWidth="1.15" />
          <path d="M142 199C149 194 156 196 158 196C165 194 173 198 176 201L175 204C164 199 152 199 142 203Z" fill="#FFF1D1" />
          <path d="M148 220C154 212 166 213 171 221C166 228 157 230 152 226Z" fill="#BE6450" />
          <path d="M144 194C150 191 154 191 158 193C165 190 173 194 177 199" stroke="#DB986A" strokeWidth="1.6" />
          <path d="M146 222C154 233 166 234 174 222" stroke="#DC9A6C" strokeWidth="2.3" />
          <path d="M154 236C159 238 165 237 169 235" stroke="#E6A66F" strokeWidth="1.2" />
        </g>

        <g className="companion-hand">
          {/* An empty, bitten waffle cone is lifted to the mouth, not a new scoop. */}
          <path d="M211 333C224 334 238 322 234 307C230 286 210 269 183 250L163 265C189 285 194 317 211 333Z" fill={`url(#${skin})`} stroke="#B77B4B" strokeWidth="1.1" />
          <path d="M210 291C220 305 223 316 219 325" stroke="#FFD093" strokeWidth="4" opacity="0.6" />
          <path d="M147 253L135 208L139 199L143 202L146 209L151 207L155 211L160 207L166 209L171 204L176 207L172 228L160 265Z" fill="#E8AE4D" stroke="#B48135" strokeWidth="1" />
          <path d="M139 207L147 250L154 257L166 224L171 211L164 214L159 212L155 216L150 214L145 216Z" fill="#F5C467" />
          <path d="M139 207L144 209L147 214L151 212L155 216L160 212L166 214L171 209" stroke="#FFDF8A" strokeWidth="2" />
          <path d="M141 218L168 228M143 228L164 238M146 239L160 246M144 214L152 253M154 216L160 246M165 216L148 244M169 222L150 252" stroke="#CA943F" strokeWidth="1.1" />
          <path d="M144 219L166 227M146 230L162 237M151 218L157 243" stroke="#FFE194" strokeWidth="0.9" />
          <path d="M168 258C162 251 151 246 143 248C138 249 136 255 140 259C143 262 150 265 153 267C143 261 138 265 141 272C142 275 148 278 153 281C146 278 142 282 147 288C151 292 159 295 163 299C175 307 190 298 189 285C187 274 178 265 168 258Z" fill={`url(#${skin})`} stroke="#B67848" strokeWidth="1.15" />
          <path d="M145 257C149 260 154 261 158 264M150 271L161 277M153 284L165 289" stroke="#CB8854" strokeWidth="1.15" />
          <path d="M177 285C173 277 169 273 163 271C157 269 155 266 158 262C163 256 173 262 181 270" fill={`url(#${skin})`} stroke="#BD7D49" strokeWidth="1.1" />
          <path d="M143 252C149 251 156 255 159 257" stroke="#FFD298" strokeWidth="2" opacity="0.7" />
        </g>
      </g>
    </svg>
  )
}
