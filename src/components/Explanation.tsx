import { LATTICE_COUNTS } from '../data/lattice.ts'
import { USP_TRAVEL_M } from '../model.ts'

const displacer = LATTICE_COUNTS.RR + LATTICE_COUNTS.AZ + LATTICE_COUNTS.LAR
const rods = displacer + LATTICE_COUNTS.AR + LATTICE_COUNTS.USP

export function Explanation() {
  return (
    <section className="sources">
      <h2>这张图在说什么</h2>
      <p>
        这是切尔诺贝利 4 号机组那种第二代 RBMK-1000 的整堆通道布置。石墨柱按 250 mm 的栅距排开，堆芯直径约 11.8 m、高约 7 m。开始 AZ-5 以后，带石墨挤水棒的棒一起向下：石墨先进入下部约 1.25 m 的水，吸收体还在上面；随后吸收体进入，示意曲线落到零以下。
      </p>
      <p>
        图上的燃料通道是 {LATTICE_COUNTS.fuel} 个，石墨柱一共 {LATTICE_COUNTS.fuel + LATTICE_COUNTS.refl + rods} 根，与公开的 1661 和 2488 一致。短棒 USP {LATTICE_COUNTS.USP}、自动棒 AR {LATTICE_COUNTS.AR}、局部自动棒 LAR {LATTICE_COUNTS.LAR} 也与公开的分组一致。AR 没有挤水棒，只下插吸收体。USP 从堆芯下面上来，行程按约 {USP_TRAVEL_M} m 画，不重复顶部那一段跳动。
      </p>
      <p>
        平面位置读自一张公开的 RBMK-1000 堆顶通道图，坐标沿用运行时的习惯，个位跳过 8 和 9。图上控制棒色块是 {rods} 个，公开资料通常写 211。多出来的大约十格，按图面深色通道保留，不把它说成 SKALA 的逐棒档案。开始时全部画成抽出，不是 1986 年 4 月 26 日凌晨每一根棒的实测插深。那天的功率增长发生在下插的最初几秒，棒没有走完这段行程。
      </p>
      <p>
        正空泡系数、低功率、大量控制棒提出，是同时存在的其他因素。本页不计算功率，也不画事故之后改过的棒。
      </p>
      <h2>资料</h2>
      <ul>
        <li>
          INSAG-7, <cite>The Chernobyl Accident: Updating of INSAG-1</cite>, IAEA Safety Series No. 75-INSAG-7, 1992. 211 根控制保护棒、24 根从下方插入的短棒、12 根不带石墨挤水棒的自动棒，以及全提出时约 1.25 m 水隙和正紧急停堆效应。
        </li>
        <li>
          World Nuclear Association, “RBMK Reactors”. 约 4.5 m 挤水棒、两端各约 1.25 m 水、紧急停堆全程约 18 s。速度约 0.4 m/s 与约 7 m 堆芯、约 18 s 全程相符。
        </li>
        <li>
          第二代 RBMK-1000 的公开堆芯数字：燃料通道 1661，控制棒通道 211，石墨柱 2488，栅距 250 mm，堆芯直径约 11.8 m、高约 7 m。短棒行程约 3.5 m 取自公开的设计参数表，只作量级。
        </li>
      </ul>
    </section>
  )
}
