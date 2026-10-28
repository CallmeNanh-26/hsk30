// ===== FILE BO SUNG TU VUNG (giao vien tu sua) =====
// Moi dong la 1 tu, cac cot cach nhau bang dau |
// tu|pinyin|cap|nhan|nghia|cau1|pinyin1|dich1|cau2|pinyin2|dich2|cau hoi|dich cau hoi|tra loi mau
//  - cap: 1-6, "7-9", hoac de trong neu tu nam ngoai HSK
//  - nhan: nhieu nhan cach nhau bang dau phay, vd: Công xưởng,Thương mại
//  - Neu tu da co trong HSK, dong nay se BO SUNG/GHI DE nghia, vi du, nhan cho tu do.
//  - Co the de trong cac cot vi du/cau hoi; bai tap se tu tao tu nghia va pinyin.
window.HSK_EXTRA = window.HSK_EXTRA || [];
HSK_EXTRA.push(`
车间|chējiān||Công xưởng|phân xưởng, xưởng sản xuất|我在二车间工作。|Wǒ zài èr chējiān gōngzuò.|Tôi làm việc ở phân xưởng số hai.|车间里不能抽烟。|Chējiān lǐ bù néng chōuyān.|Trong xưởng không được hút thuốc.|你在哪个车间工作？|Bạn làm ở phân xưởng nào?|我在包装车间工作。
工作服|gōngzuòfú||Công xưởng|quần áo bảo hộ, đồng phục làm việc|进车间要穿工作服。|Jìn chējiān yào chuān gōngzuòfú.|Vào xưởng phải mặc đồ bảo hộ.|我的工作服脏了。|Wǒ de gōngzuòfú zāng le.|Đồ bảo hộ của tôi bẩn rồi.|你的工作服是什么颜色的？|Đồ bảo hộ của bạn màu gì?|我的工作服是蓝色的。
零件|língjiàn||Công xưởng|linh kiện, chi tiết máy|这个零件坏了。|Zhège língjiàn huài le.|Linh kiện này hỏng rồi.|仓库里还有很多零件。|Cāngkù lǐ hái yǒu hěn duō língjiàn.|Trong kho vẫn còn nhiều linh kiện.|这个零件可以用吗？|Linh kiện này dùng được không?|不可以，这个零件坏了。
组长|zǔzhǎng||Công xưởng|tổ trưởng|有问题请找组长。|Yǒu wèntí qǐng zhǎo zǔzhǎng.|Có vấn đề hãy tìm tổ trưởng.|我们组长很好。|Wǒmen zǔzhǎng hěn hǎo.|Tổ trưởng của chúng tôi rất tốt.|你们的组长是谁？|Tổ trưởng của các bạn là ai?|我们的组长是王先生。
夜班|yèbān||Công xưởng|ca đêm|这个星期我上夜班。|Zhège xīngqī wǒ shàng yèbān.|Tuần này tôi làm ca đêm.|上夜班很累。|Shàng yèbān hěn lèi.|Làm ca đêm rất mệt.|你上白班还是夜班？|Bạn làm ca ngày hay ca đêm?|我上夜班。
白班|báibān||Công xưởng|ca ngày|白班早上八点开始。|Báibān zǎoshang bā diǎn kāishǐ.|Ca ngày bắt đầu lúc tám giờ sáng.|下个星期我上白班。|Xià gè xīngqī wǒ shàng báibān.|Tuần sau tôi làm ca ngày.|白班几点下班？|Ca ngày mấy giờ tan ca?|白班五点下班。
流水线|liúshuǐxiàn||Công xưởng|dây chuyền sản xuất|我在流水线上工作。|Wǒ zài liúshuǐxiàn shang gōngzuò.|Tôi làm việc trên dây chuyền.|流水线停了。|Liúshuǐxiàn tíng le.|Dây chuyền dừng rồi.|流水线为什么停了？|Tại sao dây chuyền dừng?|机器坏了。
螺丝|luósī||Công xưởng|ốc vít|请给我几个螺丝。|Qǐng gěi wǒ jǐ gè luósī.|Cho tôi vài con ốc vít.|这个螺丝太松了。|Zhège luósī tài sōng le.|Con ốc này lỏng quá.|你需要多少个螺丝？|Bạn cần bao nhiêu ốc vít?|我需要十个螺丝。
模具|mújù||Công xưởng|khuôn (đúc, ép)|这个模具要修理。|Zhège mújù yào xiūlǐ.|Cái khuôn này cần sửa.|换模具要半个小时。|Huàn mújù yào bàn gè xiǎoshí.|Thay khuôn mất nửa tiếng.|换模具要多长时间？|Thay khuôn mất bao lâu?|要半个小时。
不良品|bùliángpǐn||Công xưởng|hàng lỗi, sản phẩm không đạt|不良品要放在红色的箱子里。|Bùliángpǐn yào fàng zài hóngsè de xiāngzi lǐ.|Hàng lỗi phải để vào thùng màu đỏ.|今天的不良品很少。|Jīntiān de bùliángpǐn hěn shǎo.|Hôm nay hàng lỗi rất ít.|今天有多少不良品？|Hôm nay có bao nhiêu hàng lỗi?|今天有五个不良品。
返工|fǎngōng||Công xưởng|làm lại (sản phẩm lỗi)|这些产品要返工。|Zhèxiē chǎnpǐn yào fǎngōng.|Những sản phẩm này phải làm lại.|返工浪费时间。|Fǎngōng làngfèi shíjiān.|Làm lại rất tốn thời gian.|这批货为什么要返工？|Tại sao lô hàng này phải làm lại?|因为质量不合格。
质检|zhìjiǎn||Công xưởng|kiểm tra chất lượng (QC)|她在质检部工作。|Tā zài zhìjiǎn bù gōngzuò.|Cô ấy làm ở bộ phận QC.|产品要先质检。|Chǎnpǐn yào xiān zhìjiǎn.|Sản phẩm phải kiểm tra chất lượng trước.|这批货质检了吗？|Lô hàng này kiểm tra chất lượng chưa?|已经质检了。
成品|chéngpǐn||Công xưởng|thành phẩm|成品放在仓库里。|Chéngpǐn fàng zài cāngkù lǐ.|Thành phẩm để trong kho.|今天做了五百个成品。|Jīntiān zuòle wǔ bǎi gè chéngpǐn.|Hôm nay làm được năm trăm thành phẩm.|成品放在哪儿？|Thành phẩm để ở đâu?|成品放在仓库里。
交货|jiāohuò||Công xưởng,Thương mại|giao hàng|我们下个月交货。|Wǒmen xià gè yuè jiāohuò.|Chúng tôi giao hàng vào tháng sau.|客户要求早点儿交货。|Kèhù yāoqiú zǎo diǎnr jiāohuò.|Khách hàng yêu cầu giao hàng sớm hơn.|什么时候交货？|Khi nào giao hàng?|下个星期五交货。
发货|fāhuò||Công xưởng,Thương mại|gửi hàng, xuất hàng|我们今天发货。|Wǒmen jīntiān fāhuò.|Hôm nay chúng tôi gửi hàng.|发货以后我给你打电话。|Fāhuò yǐhòu wǒ gěi nǐ dǎ diànhuà.|Sau khi gửi hàng tôi sẽ gọi điện cho bạn.|货发了吗？|Hàng gửi đi chưa?|已经发货了。
规格|guīgé||Công xưởng,Thương mại|quy cách, thông số|这个产品的规格是什么？|Zhège chǎnpǐn de guīgé shì shénme?|Quy cách của sản phẩm này là gì?|规格不对，不能用。|Guīgé bú duì, bù néng yòng.|Quy cách không đúng, không dùng được.|这批货的规格对吗？|Quy cách lô hàng này đúng không?|对，没有问题。
厂长|chǎngzhǎng||Công xưởng|giám đốc nhà máy, xưởng trưởng|厂长今天来车间了。|Chǎngzhǎng jīntiān lái chējiān le.|Hôm nay giám đốc nhà máy xuống xưởng.|厂长在开会。|Chǎngzhǎng zài kāihuì.|Giám đốc nhà máy đang họp.|厂长在哪儿？|Giám đốc nhà máy ở đâu?|厂长在办公室。
付款|fùkuǎn||Thương mại|thanh toán, trả tiền|客户已经付款了。|Kèhù yǐjīng fùkuǎn le.|Khách hàng đã thanh toán rồi.|可以用手机付款吗？|Kěyǐ yòng shǒujī fùkuǎn ma?|Có thể thanh toán bằng điện thoại không?|你们怎么付款？|Các anh thanh toán bằng cách nào?|我们用银行卡付款。
报价|bàojià||Thương mại|báo giá|请给我们报价。|Qǐng gěi wǒmen bàojià.|Xin hãy báo giá cho chúng tôi.|你们的报价太高了。|Nǐmen de bàojià tài gāo le.|Báo giá của các anh cao quá.|报价什么时候发给我？|Khi nào gửi báo giá cho tôi?|明天上午发给您。
样品|yàngpǐn||Thương mại,Công xưởng|hàng mẫu|这是我们的样品。|Zhè shì wǒmen de yàngpǐn.|Đây là hàng mẫu của chúng tôi.|客户很喜欢这个样品。|Kèhù hěn xǐhuan zhège yàngpǐn.|Khách hàng rất thích mẫu này.|可以给我一个样品吗？|Có thể cho tôi một mẫu không?|可以，这是样品。
库存|kùcún||Thương mại,Công xưởng|hàng tồn kho|这个产品没有库存了。|Zhège chǎnpǐn méiyǒu kùcún le.|Sản phẩm này hết hàng tồn kho rồi.|请查一下库存。|Qǐng chá yíxià kùcún.|Hãy kiểm tra hàng tồn kho.|还有多少库存？|Còn bao nhiêu hàng tồn?|还有两千个。
美元|měiyuán||Thương mại|đô la Mỹ (USD)|这个多少美元？|Zhège duōshao měiyuán?|Cái này bao nhiêu đô la?|我们用美元付款。|Wǒmen yòng měiyuán fùkuǎn.|Chúng tôi thanh toán bằng đô la Mỹ.|一个多少美元？|Một cái bao nhiêu đô la?|一个五美元。
收据|shōujù||Thương mại|biên lai, phiếu thu|请给我一张收据。|Qǐng gěi wǒ yì zhāng shōujù.|Cho tôi một tờ biên lai.|收据要保存好。|Shōujù yào bǎocún hǎo.|Biên lai phải giữ cẩn thận.|你要收据吗？|Bạn có cần biên lai không?|要，谢谢。
展会|zhǎnhuì||Thương mại|hội chợ, triển lãm|我们去广州参加展会。|Wǒmen qù Guǎngzhōu cānjiā zhǎnhuì.|Chúng tôi đi Quảng Châu tham gia hội chợ.|在展会上认识了很多客户。|Zài zhǎnhuì shang rènshile hěn duō kèhù.|Ở hội chợ đã quen được nhiều khách hàng.|展会在哪儿？|Hội chợ ở đâu?|展会在广州。
`);
