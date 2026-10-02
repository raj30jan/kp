USE kisanpatrika;

-- 003: Fill name_hi for all category tree nodes missing a Hindi name,
-- keyed by slug (idempotent — safe to re-run).

-- Vegetables
UPDATE categories SET name_hi='प्याज़' WHERE slug='vegetables-onion';
UPDATE categories SET name_hi='अदरक' WHERE slug='vegetables-ginger';
UPDATE categories SET name_hi='हरी मिर्च' WHERE slug='vegetables-green-chilli';
UPDATE categories SET name_hi='शिमला मिर्च' WHERE slug='vegetables-capsicum-bell-pepper';
UPDATE categories SET name_hi='बैंगन' WHERE slug='vegetables-brinjal-eggplant';
UPDATE categories SET name_hi='भिंडी / ओकरा' WHERE slug='vegetables-okra-bhindi';
UPDATE categories SET name_hi='पत्ता गोभी' WHERE slug='vegetables-cabbage';
UPDATE categories SET name_hi='फूलगोभी' WHERE slug='vegetables-cauliflower';
UPDATE categories SET name_hi='ब्रोकली' WHERE slug='vegetables-broccoli';
UPDATE categories SET name_hi='गाजर' WHERE slug='vegetables-carrot';
UPDATE categories SET name_hi='चुकंदर' WHERE slug='vegetables-beetroot';
UPDATE categories SET name_hi='मूली' WHERE slug='vegetables-radish';
UPDATE categories SET name_hi='शलजम' WHERE slug='vegetables-turnip';
UPDATE categories SET name_hi='मटर' WHERE slug='vegetables-peas';
UPDATE categories SET name_hi='फ्रेंच बीन्स' WHERE slug='vegetables-french-beans';
UPDATE categories SET name_hi='ग्वार की फली' WHERE slug='vegetables-cluster-beans';
UPDATE categories SET name_hi='खीरा' WHERE slug='vegetables-cucumber';
UPDATE categories SET name_hi='लौकी' WHERE slug='vegetables-bottle-gourd-lauki';
UPDATE categories SET name_hi='करेला' WHERE slug='vegetables-bitter-gourd-karela';
UPDATE categories SET name_hi='तुरई / झींगा' WHERE slug='vegetables-ridge-gourd-turai';
UPDATE categories SET name_hi='गिलकी' WHERE slug='vegetables-sponge-gourd';
UPDATE categories SET name_hi='परवल' WHERE slug='vegetables-pointed-gourd-parwal';
UPDATE categories SET name_hi='कद्दू' WHERE slug='vegetables-pumpkin';
UPDATE categories SET name_hi='पेठा / सफेद कद्दू' WHERE slug='vegetables-ash-gourd-petha';
UPDATE categories SET name_hi='सहजन / मोरिंगा' WHERE slug='vegetables-drumstick-moringa';
UPDATE categories SET name_hi='शकरकंद' WHERE slug='vegetables-sweet-potato';
UPDATE categories SET name_hi='अरबी' WHERE slug='vegetables-taro-arbi';
UPDATE categories SET name_hi='कच्चा केला' WHERE slug='vegetables-raw-banana';
UPDATE categories SET name_hi='कच्चा पपीता' WHERE slug='vegetables-raw-papaya';
UPDATE categories SET name_hi='मशरूम / खुंभ' WHERE slug='vegetables-mushroom';
UPDATE categories SET name_hi='पालक' WHERE slug='vegetables-spinach-palak';
UPDATE categories SET name_hi='मेथी' WHERE slug='vegetables-fenugreek-methi';
UPDATE categories SET name_hi='हरा धनिया' WHERE slug='vegetables-coriander-leaves';
UPDATE categories SET name_hi='पुदीना' WHERE slug='vegetables-mint';
UPDATE categories SET name_hi='लेट्यूस / सलाद पत्ता' WHERE slug='vegetables-lettuce';
UPDATE categories SET name_hi='ज़ूकीनी / तोरी' WHERE slug='vegetables-zucchini';
UPDATE categories SET name_hi='स्वीट कॉर्न / मीठा मक्का' WHERE slug='vegetables-sweet-corn';
UPDATE categories SET name_hi='अन्य सब्जियाँ' WHERE slug='vegetables-other-vegetables';

-- Fodder & Animal Feed
UPDATE categories SET name_hi='चारा व पशु आहार' WHERE slug='fodder';
UPDATE categories SET name_hi='पशु आहार' WHERE slug='fodder-cattle-feed';
UPDATE categories SET name_hi='सूखा चारा / पराल' WHERE slug='fodder-dry-fodder-hay';
UPDATE categories SET name_hi='हरा चारा' WHERE slug='fodder-green-fodder';
UPDATE categories SET name_hi='खनिज मिश्रण' WHERE slug='fodder-mineral-mixture';
UPDATE categories SET name_hi='पोल्ट्री फीड / मुर्गी दाना' WHERE slug='fodder-poultry-feed';
UPDATE categories SET name_hi='साइलेज' WHERE slug='fodder-silage';

-- Processed Agro Products
UPDATE categories SET name_hi='प्रसंस्कृत कृषि उत्पाद' WHERE slug='processed-foods';
UPDATE categories SET name_hi='कोल्ड-प्रेस्ड / कच्छी घानी तेल' WHERE slug='processed-foods-cold-pressed-oils';
UPDATE categories SET name_hi='आटा / बेसन' WHERE slug='processed-foods-flour-atta-besan';
UPDATE categories SET name_hi='फ्रूट पल्प व जैम' WHERE slug='processed-foods-fruit-pulp-jam';
UPDATE categories SET name_hi='गुड़' WHERE slug='processed-foods-jaggery-gur';
UPDATE categories SET name_hi='पापड़ व नमकीन' WHERE slug='processed-foods-papad-snacks';
UPDATE categories SET name_hi='अचार व चटनी' WHERE slug='processed-foods-pickles-chutney';

-- Farm Structures
UPDATE categories SET name_hi='फार्म संरचनाएँ' WHERE slug='farm-structures';
UPDATE categories SET name_hi='पशुशाला सामग्री' WHERE slug='farm-structures-cattle-shed-material';
UPDATE categories SET name_hi='ग्रीनहाउस' WHERE slug='farm-structures-greenhouse';
UPDATE categories SET name_hi='मल्चिंग फिल्म' WHERE slug='farm-structures-mulching-film';
UPDATE categories SET name_hi='पॉलीहाउस' WHERE slug='farm-structures-polyhouse';
UPDATE categories SET name_hi='शेड नेट / छाया जाल' WHERE slug='farm-structures-shade-net';
UPDATE categories SET name_hi='वर्मीकम्पोस्ट बेड' WHERE slug='farm-structures-vermicompost-beds';

-- Post-Harvest & Storage
UPDATE categories SET name_hi='कटाई-पश्चात व भंडारण' WHERE slug='post-harvest-storage';
UPDATE categories SET name_hi='कोल्ड स्टोरेज / शीतगृह' WHERE slug='post-harvest-storage-cold-storage';
UPDATE categories SET name_hi='ग्रेडिंग व छँटाई मशीनें' WHERE slug='post-harvest-storage-grading-sorting-machines';
UPDATE categories SET name_hi='अनाज सुखाने की मशीनें' WHERE slug='post-harvest-storage-grain-dryers';
UPDATE categories SET name_hi='अनाज साइलो व बिन' WHERE slug='post-harvest-storage-grain-silos-bins';
UPDATE categories SET name_hi='गोदाम स्थान' WHERE slug='post-harvest-storage-warehouse-space';

-- Agricultural Packaging
UPDATE categories SET name_hi='कृषि पैकेजिंग' WHERE slug='packaging';
UPDATE categories SET name_hi='फल नेट व ट्रे' WHERE slug='packaging-fruit-nets-trays';
UPDATE categories SET name_hi='जूट बोरियाँ' WHERE slug='packaging-jute-bags';
UPDATE categories SET name_hi='प्लास्टिक क्रेट्स / टोकरा' WHERE slug='packaging-plastic-crates';
UPDATE categories SET name_hi='पीपी / एचडीपीई बोरियाँ' WHERE slug='packaging-pp-hdpe-bags';
UPDATE categories SET name_hi='लकड़ी के बक्से / पेटी' WHERE slug='packaging-wooden-boxes';

-- Agri Waste & By-products
UPDATE categories SET name_hi='कृषि अपशिष्ट व उप-उत्पाद' WHERE slug='agri-byproducts';
UPDATE categories SET name_hi='गोबर के कंडे / खाद' WHERE slug='agri-byproducts-cow-dung-cakes-manure';
UPDATE categories SET name_hi='फसल अवशेष' WHERE slug='agri-byproducts-crop-residue';
UPDATE categories SET name_hi='धान की पराली' WHERE slug='agri-byproducts-paddy-straw';
UPDATE categories SET name_hi='चावल का छिलका' WHERE slug='agri-byproducts-rice-husk';
UPDATE categories SET name_hi='गन्ना बगास' WHERE slug='agri-byproducts-sugarcane-bagasse';
UPDATE categories SET name_hi='गेहूँ का भूसा' WHERE slug='agri-byproducts-wheat-straw-bhusa';

-- Fruits
UPDATE categories SET name_hi='फल' WHERE slug='fruits';
UPDATE categories SET name_hi='सेब' WHERE slug='fruits-apple';
UPDATE categories SET name_hi='खुबानी' WHERE slug='fruits-apricot';
UPDATE categories SET name_hi='केला' WHERE slug='fruits-banana';
UPDATE categories SET name_hi='आम' WHERE slug='fruits-mango';
UPDATE categories SET name_hi='अमरूद' WHERE slug='fruits-guava';
UPDATE categories SET name_hi='अंगूर' WHERE slug='fruits-grapes';
UPDATE categories SET name_hi='संतरा' WHERE slug='fruits-orange';
UPDATE categories SET name_hi='मौसमी' WHERE slug='fruits-sweet-lime-mosambi';
UPDATE categories SET name_hi='किन्नू' WHERE slug='fruits-kinnow';
UPDATE categories SET name_hi='माल्टा' WHERE slug='fruits-malta';
UPDATE categories SET name_hi='अनार' WHERE slug='fruits-pomegranate';
UPDATE categories SET name_hi='पपीता' WHERE slug='fruits-papaya';
UPDATE categories SET name_hi='तरबूज' WHERE slug='fruits-watermelon';
UPDATE categories SET name_hi='खरबूजा' WHERE slug='fruits-muskmelon';
UPDATE categories SET name_hi='लीची' WHERE slug='fruits-litchi';
UPDATE categories SET name_hi='कटहल' WHERE slug='fruits-jackfruit';
UPDATE categories SET name_hi='अनानास' WHERE slug='fruits-pineapple';
UPDATE categories SET name_hi='नारियल' WHERE slug='fruits-coconut';
UPDATE categories SET name_hi='खजूर' WHERE slug='fruits-dates';
UPDATE categories SET name_hi='स्ट्रॉबेरी' WHERE slug='fruits-strawberry';
UPDATE categories SET name_hi='चेरी' WHERE slug='fruits-cherry';
UPDATE categories SET name_hi='एवोकाडो' WHERE slug='fruits-avocado';
UPDATE categories SET name_hi='आड़ू' WHERE slug='fruits-peach';
UPDATE categories SET name_hi='आलूबुखारा' WHERE slug='fruits-plum';
UPDATE categories SET name_hi='नाशपाती' WHERE slug='fruits-pear';
UPDATE categories SET name_hi='कीवी' WHERE slug='fruits-kiwi';
UPDATE categories SET name_hi='अंजीर' WHERE slug='fruits-fig';
UPDATE categories SET name_hi='ड्रैगन फ्रूट' WHERE slug='fruits-dragon-fruit';
UPDATE categories SET name_hi='शरीफा / सीताफल' WHERE slug='fruits-custard-apple';
UPDATE categories SET name_hi='बेर' WHERE slug='fruits-ber';
UPDATE categories SET name_hi='आँवला' WHERE slug='fruits-amla-indian-gooseberry';
UPDATE categories SET name_hi='अन्य फल' WHERE slug='fruits-other-fruits';

-- Organic Products
UPDATE categories SET name_hi='जैविक उत्पाद' WHERE slug='organic-products';
UPDATE categories SET name_hi='जैविक सब्जियाँ' WHERE slug='organic-products-organic-vegetables';
UPDATE categories SET name_hi='जैविक फल' WHERE slug='organic-products-organic-fruits';
UPDATE categories SET name_hi='जैविक अनाज' WHERE slug='organic-products-organic-grains';
UPDATE categories SET name_hi='जैविक दालें' WHERE slug='organic-products-organic-pulses';
UPDATE categories SET name_hi='जैविक मसाले' WHERE slug='organic-products-organic-spices';
UPDATE categories SET name_hi='जैविक तिलहन' WHERE slug='organic-products-organic-oilseeds';
UPDATE categories SET name_hi='जैविक खाद्य तेल' WHERE slug='organic-products-organic-edible-oils';
UPDATE categories SET name_hi='जैविक शहद' WHERE slug='organic-products-organic-honey';
UPDATE categories SET name_hi='जैविक चाय व कॉफी' WHERE slug='organic-products-organic-tea-and-coffee';
UPDATE categories SET name_hi='जैविक प्रसंस्कृत खाद्य पदार्थ' WHERE slug='organic-products-organic-processed-foods';

-- Spices
UPDATE categories SET name_hi='मसाले' WHERE slug='spices';
UPDATE categories SET name_hi='काली मिर्च' WHERE slug='spices-black-pepper';
UPDATE categories SET name_hi='हल्दी' WHERE slug='spices-turmeric-haldi';
UPDATE categories SET name_hi='जीरा' WHERE slug='spices-cumin-jeera';
UPDATE categories SET name_hi='धनिया' WHERE slug='spices-coriander-seed-dhania';
UPDATE categories SET name_hi='इलायची' WHERE slug='spices-cardamom-elaichi';
UPDATE categories SET name_hi='लौंग' WHERE slug='spices-clove-laung';
UPDATE categories SET name_hi='दालचीनी' WHERE slug='spices-cinnamon-dalchini';
UPDATE categories SET name_hi='सौंफ' WHERE slug='spices-fennel-saunf';
UPDATE categories SET name_hi='साबुत मेथी' WHERE slug='spices-fenugreek-sabut-methi';
UPDATE categories SET name_hi='सरसों' WHERE slug='spices-mustard-seed';
UPDATE categories SET name_hi='अजवाइन' WHERE slug='spices-ajwain';
UPDATE categories SET name_hi='सूखी लाल मिर्च' WHERE slug='spices-dry-red-chilli';
UPDATE categories SET name_hi='जायफल व जावित्री' WHERE slug='spices-nutmeg-and-mace';
UPDATE categories SET name_hi='चक्र फूल / स्टार एनीस' WHERE slug='spices-star-anise';
UPDATE categories SET name_hi='तेज पत्ता' WHERE slug='spices-bay-leaf-tej-patta';
UPDATE categories SET name_hi='सोंठ / सूखी अदरक' WHERE slug='spices-ginger-dry-sonth';
UPDATE categories SET name_hi='सूखा लहसुन' WHERE slug='spices-garlic-dry';
UPDATE categories SET name_hi='मिश्रित मसाले' WHERE slug='spices-mixed-spices';
UPDATE categories SET name_hi='अन्य मसाले' WHERE slug='spices-other-spices';

-- Dry Fruits & Nuts
UPDATE categories SET name_hi='सूखे मेवे व नट्स' WHERE slug='dry-fruits-nuts';
UPDATE categories SET name_hi='बादाम' WHERE slug='dry-fruits-nuts-almond';
UPDATE categories SET name_hi='काजू' WHERE slug='dry-fruits-nuts-cashew';
UPDATE categories SET name_hi='अखरोट' WHERE slug='dry-fruits-nuts-walnut';
UPDATE categories SET name_hi='पिस्ता' WHERE slug='dry-fruits-nuts-pistachio';
UPDATE categories SET name_hi='किशमिश' WHERE slug='dry-fruits-nuts-raisin';
UPDATE categories SET name_hi='खजूर' WHERE slug='dry-fruits-nuts-dates';
UPDATE categories SET name_hi='सूखा अंजीर' WHERE slug='dry-fruits-nuts-figs';
UPDATE categories SET name_hi='सूखी खुबानी' WHERE slug='dry-fruits-nuts-apricot-dry';
UPDATE categories SET name_hi='प्रुन्स / सूखा आलूबुखारा' WHERE slug='dry-fruits-nuts-prunes';
UPDATE categories SET name_hi='मूंगफली' WHERE slug='dry-fruits-nuts-peanuts';
UPDATE categories SET name_hi='मखाना' WHERE slug='dry-fruits-nuts-fox-nuts-makhana';
UPDATE categories SET name_hi='अन्य सूखे मेवे व नट्स' WHERE slug='dry-fruits-nuts-other-dry-fruits-and-nuts';

-- Pulses & Legumes
UPDATE categories SET name_hi='दालें व फलियाँ' WHERE slug='pulses';
UPDATE categories SET name_hi='चना' WHERE slug='pulses-chickpea-gram-chana';
UPDATE categories SET name_hi='अरहर / तूर दाल' WHERE slug='pulses-pigeon-pea-arhar-tur';
UPDATE categories SET name_hi='उड़द' WHERE slug='pulses-black-gram-urad';
UPDATE categories SET name_hi='मूंग' WHERE slug='pulses-green-gram-moong';
UPDATE categories SET name_hi='मसूर दाल' WHERE slug='pulses-lentil-masoor';
UPDATE categories SET name_hi='राजमा' WHERE slug='pulses-kidney-bean-rajma';
UPDATE categories SET name_hi='लोबिया / चौली' WHERE slug='pulses-black-eyed-pea-lobia';
UPDATE categories SET name_hi='बाकला' WHERE slug='pulses-broad-bean';
UPDATE categories SET name_hi='देसी मटर' WHERE slug='pulses-field-pea';
UPDATE categories SET name_hi='सोयाबीन' WHERE slug='pulses-soybean';
UPDATE categories SET name_hi='कुलथी' WHERE slug='pulses-horse-gram-kulthi';
UPDATE categories SET name_hi='लोबिया / चौला' WHERE slug='pulses-cowpea';
UPDATE categories SET name_hi='अन्य दालें' WHERE slug='pulses-other-pulses';

-- Rice
UPDATE categories SET name_hi='चावल' WHERE slug='rice';
UPDATE categories SET name_hi='धान' WHERE slug='rice-paddy-dhan';
UPDATE categories SET name_hi='बासमती चावल' WHERE slug='rice-basmati-rice';
UPDATE categories SET name_hi='नॉन-बासमती चावल' WHERE slug='rice-non-basmati-rice';
UPDATE categories SET name_hi='ब्राउन राइस' WHERE slug='rice-brown-rice';
UPDATE categories SET name_hi='उसना चावल' WHERE slug='rice-parboiled-rice';
UPDATE categories SET name_hi='सेला चावल' WHERE slug='rice-sella-rice';
UPDATE categories SET name_hi='टूटा चावल / कंकी' WHERE slug='rice-broken-rice';
UPDATE categories SET name_hi='चावल का चोकर' WHERE slug='rice-rice-bran';
UPDATE categories SET name_hi='चावल का आटा' WHERE slug='rice-rice-flour';
UPDATE categories SET name_hi='अन्य चावल' WHERE slug='rice-other-rice';

-- Grains & Cereals
UPDATE categories SET name_hi='अनाज व खाद्यान्न' WHERE slug='grains-cereals';
UPDATE categories SET name_hi='गेहूँ' WHERE slug='grains-cereals-wheat';
UPDATE categories SET name_hi='मक्का' WHERE slug='grains-cereals-maize-corn';
UPDATE categories SET name_hi='जौ' WHERE slug='grains-cereals-barley';
UPDATE categories SET name_hi='ज्वार' WHERE slug='grains-cereals-sorghum-jowar';
UPDATE categories SET name_hi='बाजरा' WHERE slug='grains-cereals-pearl-millet-bajra';
UPDATE categories SET name_hi='रागी / मड़ुआ' WHERE slug='grains-cereals-finger-millet-ragi';
UPDATE categories SET name_hi='कांगनी / काकुं' WHERE slug='grains-cereals-foxtail-millet';
UPDATE categories SET name_hi='कुटकी' WHERE slug='grains-cereals-little-millet';
UPDATE categories SET name_hi='कोदो' WHERE slug='grains-cereals-kodo-millet';
UPDATE categories SET name_hi='चीना' WHERE slug='grains-cereals-proso-millet';
UPDATE categories SET name_hi='सांवां / झंगोरा' WHERE slug='grains-cereals-barnyard-millet';
UPDATE categories SET name_hi='जई / ओट्स' WHERE slug='grains-cereals-oats';
UPDATE categories SET name_hi='राई' WHERE slug='grains-cereals-rye';
UPDATE categories SET name_hi='क्विनोआ' WHERE slug='grains-cereals-quinoa';
UPDATE categories SET name_hi='गेहूँ का आटा' WHERE slug='grains-cereals-wheat-flour-atta';
UPDATE categories SET name_hi='मक्का का आटा' WHERE slug='grains-cereals-maize-flour';
UPDATE categories SET name_hi='अन्य अनाज' WHERE slug='grains-cereals-other-cereals';

-- Oilseeds
UPDATE categories SET name_hi='तिलहन' WHERE slug='oilseeds';
UPDATE categories SET name_hi='सरसों' WHERE slug='oilseeds-mustard-seed';
UPDATE categories SET name_hi='सोयाबीन' WHERE slug='oilseeds-soybean';
UPDATE categories SET name_hi='मूंगफली' WHERE slug='oilseeds-groundnut-peanut';
UPDATE categories SET name_hi='सूरजमुखी बीज' WHERE slug='oilseeds-sunflower-seed';
UPDATE categories SET name_hi='तिल' WHERE slug='oilseeds-sesame-til';
UPDATE categories SET name_hi='अलसी' WHERE slug='oilseeds-linseed-alsi';
UPDATE categories SET name_hi='कुसुम' WHERE slug='oilseeds-safflower';
UPDATE categories SET name_hi='अरंडी' WHERE slug='oilseeds-castor-seed';
UPDATE categories SET name_hi='रामतिल' WHERE slug='oilseeds-niger-seed';
UPDATE categories SET name_hi='बिनौला / कपास बीज' WHERE slug='oilseeds-cottonseed';
UPDATE categories SET name_hi='अन्य तिलहन' WHERE slug='oilseeds-other-oilseeds';

-- Edible Oils
UPDATE categories SET name_hi='खाद्य तेल' WHERE slug='edible-oils';
UPDATE categories SET name_hi='सरसों तेल' WHERE slug='edible-oils-mustard-oil';
UPDATE categories SET name_hi='मूंगफली तेल' WHERE slug='edible-oils-groundnut-oil';
UPDATE categories SET name_hi='सूरजमुखी तेल' WHERE slug='edible-oils-sunflower-oil';
UPDATE categories SET name_hi='सोयाबीन तेल' WHERE slug='edible-oils-soybean-oil';
UPDATE categories SET name_hi='तिल का तेल' WHERE slug='edible-oils-sesame-oil';
UPDATE categories SET name_hi='राइस ब्रान तेल' WHERE slug='edible-oils-rice-bran-oil';
UPDATE categories SET name_hi='नारियल तेल' WHERE slug='edible-oils-coconut-oil';
UPDATE categories SET name_hi='जैतून का तेल' WHERE slug='edible-oils-olive-oil';
UPDATE categories SET name_hi='पाम तेल' WHERE slug='edible-oils-palm-oil';
UPDATE categories SET name_hi='अन्य खाद्य तेल' WHERE slug='edible-oils-other-edible-oils';

-- Dairy
UPDATE categories SET name_hi='डेयरी व डेयरी उत्पाद' WHERE slug='dairy';
UPDATE categories SET name_hi='दूध' WHERE slug='dairy-milk';
UPDATE categories SET name_hi='दही' WHERE slug='dairy-curd-dahi';
UPDATE categories SET name_hi='पनीर' WHERE slug='dairy-paneer';
UPDATE categories SET name_hi='घी' WHERE slug='dairy-ghee';
UPDATE categories SET name_hi='मक्खन' WHERE slug='dairy-butter';
UPDATE categories SET name_hi='चीज़' WHERE slug='dairy-cheese';
UPDATE categories SET name_hi='दूध पाउडर' WHERE slug='dairy-milk-powder';
UPDATE categories SET name_hi='मलाई / क्रीम' WHERE slug='dairy-cream';
UPDATE categories SET name_hi='छाछ / मठ्ठा' WHERE slug='dairy-buttermilk';
UPDATE categories SET name_hi='पौध-आधारित दूध व विकल्प' WHERE slug='dairy-plant-based-milk-and-substitutes';
UPDATE categories SET name_hi='अन्य डेयरी उत्पाद' WHERE slug='dairy-other-dairy-products';

-- Beverages
UPDATE categories SET name_hi='पेय पदार्थ' WHERE slug='beverages';
UPDATE categories SET name_hi='चाय' WHERE slug='beverages-tea';
UPDATE categories SET name_hi='कॉफी' WHERE slug='beverages-coffee';
UPDATE categories SET name_hi='फलों का रस' WHERE slug='beverages-fruit-juice';
UPDATE categories SET name_hi='गन्ने का रस' WHERE slug='beverages-sugarcane-juice';
UPDATE categories SET name_hi='हर्बल पेय' WHERE slug='beverages-herbal-beverages';
UPDATE categories SET name_hi='नारियल पानी' WHERE slug='beverages-coconut-water';
UPDATE categories SET name_hi='अन्य पेय' WHERE slug='beverages-other-beverages';

-- Honey & Bee Products
UPDATE categories SET name_hi='शहद व मधुमक्खी उत्पाद' WHERE slug='honey';
UPDATE categories SET name_hi='प्राकृतिक शहद' WHERE slug='honey-natural-honey';
UPDATE categories SET name_hi='पुष्प शहद' WHERE slug='honey-floral-honey';
UPDATE categories SET name_hi='सरसों का शहद' WHERE slug='honey-mustard-honey';
UPDATE categories SET name_hi='वन शहद' WHERE slug='honey-forest-honey';
UPDATE categories SET name_hi='मधुमक्खी मोम' WHERE slug='honey-beeswax';
UPDATE categories SET name_hi='बी पोलन / पराग' WHERE slug='honey-bee-pollen';
UPDATE categories SET name_hi='प्रोपोलिस' WHERE slug='honey-propolis';
UPDATE categories SET name_hi='अन्य मधुमक्खी उत्पाद' WHERE slug='honey-other-bee-products';

-- Flowers
UPDATE categories SET name_hi='फूल' WHERE slug='flowers';
UPDATE categories SET name_hi='गुलाब' WHERE slug='flowers-rose';
UPDATE categories SET name_hi='गेंदा' WHERE slug='flowers-marigold';
UPDATE categories SET name_hi='गुलदाउदी' WHERE slug='flowers-chrysanthemum';
UPDATE categories SET name_hi='चमेली / मोगरा' WHERE slug='flowers-jasmine';
UPDATE categories SET name_hi='रजनीगंधा' WHERE slug='flowers-tuberose-rajnigandha';
UPDATE categories SET name_hi='गरबेरा' WHERE slug='flowers-gerbera';
UPDATE categories SET name_hi='कार्नेशन' WHERE slug='flowers-carnation';
UPDATE categories SET name_hi='ऑर्किड' WHERE slug='flowers-orchid';
UPDATE categories SET name_hi='ग्लैडियोलस' WHERE slug='flowers-gladiolus';
UPDATE categories SET name_hi='कमल' WHERE slug='flowers-lotus';
UPDATE categories SET name_hi='कटे फूल' WHERE slug='flowers-cut-flowers';
UPDATE categories SET name_hi='फूलों के कंद' WHERE slug='flowers-flower-bulbs';
UPDATE categories SET name_hi='अन्य फूल' WHERE slug='flowers-other-flowers';

-- Fiber Crops
UPDATE categories SET name_hi='रेशा फसलें' WHERE slug='fiber-crops';
UPDATE categories SET name_hi='कपास' WHERE slug='fiber-crops-cotton';
UPDATE categories SET name_hi='जूट / पटसन' WHERE slug='fiber-crops-jute';
UPDATE categories SET name_hi='पटुवा / भांग' WHERE slug='fiber-crops-hemp';
UPDATE categories SET name_hi='सन / अलसी रेशा' WHERE slug='fiber-crops-flax';
UPDATE categories SET name_hi='सिसल' WHERE slug='fiber-crops-sisal';
UPDATE categories SET name_hi='अम्बरी / केनाफ' WHERE slug='fiber-crops-kenaf';
UPDATE categories SET name_hi='अन्य रेशा फसलें' WHERE slug='fiber-crops-other-fiber-crops';

-- Forest Products
UPDATE categories SET name_hi='वन उपज' WHERE slug='forest-products';
UPDATE categories SET name_hi='इमारती लकड़ी' WHERE slug='forest-products-timber';
UPDATE categories SET name_hi='बांस' WHERE slug='forest-products-bamboo';
UPDATE categories SET name_hi='जलावन लकड़ी' WHERE slug='forest-products-firewood';
UPDATE categories SET name_hi='लकड़ी का कोयला' WHERE slug='forest-products-charcoal';
UPDATE categories SET name_hi='गोंद व राल' WHERE slug='forest-products-gum-and-resin';
UPDATE categories SET name_hi='तेंदू पत्ता' WHERE slug='forest-products-tendu-leaves';
UPDATE categories SET name_hi='औषधीय वन उपज' WHERE slug='forest-products-medicinal-forest-produce';
UPDATE categories SET name_hi='बांस उत्पाद' WHERE slug='forest-products-bamboo-products';
UPDATE categories SET name_hi='अन्य वन उपज' WHERE slug='forest-products-other-forest-products';

-- Livestock
UPDATE categories SET name_hi='पशुधन' WHERE slug='livestock';
UPDATE categories SET name_hi='मवेशी' WHERE slug='livestock-cattle';
UPDATE categories SET name_hi='भैंस' WHERE slug='livestock-buffalo';
UPDATE categories SET name_hi='गाय' WHERE slug='livestock-cow';
UPDATE categories SET name_hi='सांड / बैल' WHERE slug='livestock-bull';
UPDATE categories SET name_hi='बकरी / बकरा' WHERE slug='livestock-goat';
UPDATE categories SET name_hi='भेड़' WHERE slug='livestock-sheep';
UPDATE categories SET name_hi='सूअर' WHERE slug='livestock-pig';
UPDATE categories SET name_hi='खरगोश' WHERE slug='livestock-rabbit';
UPDATE categories SET name_hi='ऊँट' WHERE slug='livestock-camel';
UPDATE categories SET name_hi='अन्य पशुधन' WHERE slug='livestock-other-livestock';

-- Fisheries
UPDATE categories SET name_hi='मत्स्य पालन' WHERE slug='fisheries';
UPDATE categories SET name_hi='मीठे पानी की मछली' WHERE slug='fisheries-freshwater-fish';
UPDATE categories SET name_hi='समुद्री मछली' WHERE slug='fisheries-marine-fish';
UPDATE categories SET name_hi='झींगा' WHERE slug='fisheries-shrimp-prawn';
UPDATE categories SET name_hi='रोहू' WHERE slug='fisheries-rohu';
UPDATE categories SET name_hi='कतला' WHERE slug='fisheries-catla';
UPDATE categories SET name_hi='तिलापिया' WHERE slug='fisheries-tilapia';
UPDATE categories SET name_hi='पंगासियस' WHERE slug='fisheries-pangasius';
UPDATE categories SET name_hi='केकड़ा' WHERE slug='fisheries-crab';
UPDATE categories SET name_hi='सीप / मसल्स' WHERE slug='fisheries-mussels';
UPDATE categories SET name_hi='मछली बीज / फिंगरलिंग्स' WHERE slug='fisheries-aquaculture-fingerlings';
UPDATE categories SET name_hi='मछली आहार' WHERE slug='fisheries-fish-feed';
UPDATE categories SET name_hi='अन्य मत्स्य उत्पाद' WHERE slug='fisheries-other-fisheries';

-- Seeds
UPDATE categories SET name_hi='बीज' WHERE slug='seeds';
UPDATE categories SET name_hi='गेहूँ के बीज' WHERE slug='seeds-wheat-seeds';
UPDATE categories SET name_hi='धान के बीज' WHERE slug='seeds-rice-seeds';
UPDATE categories SET name_hi='मक्का के बीज' WHERE slug='seeds-maize-seeds';
UPDATE categories SET name_hi='कपास के बीज' WHERE slug='seeds-cotton-seeds';
UPDATE categories SET name_hi='सरसों के बीज' WHERE slug='seeds-mustard-seeds';
UPDATE categories SET name_hi='दलहन के बीज' WHERE slug='seeds-pulses-seeds';
UPDATE categories SET name_hi='तिलहन के बीज' WHERE slug='seeds-oilseed-seeds';
UPDATE categories SET name_hi='सब्जी के बीज' WHERE slug='seeds-vegetable-seeds';
UPDATE categories SET name_hi='फलदार पौधों के बीज' WHERE slug='seeds-fruit-seeds';
UPDATE categories SET name_hi='चारा बीज' WHERE slug='seeds-fodder-seeds';
UPDATE categories SET name_hi='फूलों के बीज' WHERE slug='seeds-flower-seeds';
UPDATE categories SET name_hi='संकर बीज' WHERE slug='seeds-hybrid-seeds';
UPDATE categories SET name_hi='जैविक बीज' WHERE slug='seeds-organic-seeds';
UPDATE categories SET name_hi='उपचारित बीज' WHERE slug='seeds-treated-seeds';
UPDATE categories SET name_hi='पौध व रोपण सामग्री' WHERE slug='seeds-seedlings-and-planting-material';

-- Fertilizers & Soil Inputs
UPDATE categories SET name_hi='उर्वरक व मृदा सुधारक' WHERE slug='fertilizers';
UPDATE categories SET name_hi='यूरिया' WHERE slug='fertilizers-urea';
UPDATE categories SET name_hi='डीएपी' WHERE slug='fertilizers-dap';
UPDATE categories SET name_hi='एमओपी / पोटाश' WHERE slug='fertilizers-mop';
UPDATE categories SET name_hi='एनपीके उर्वरक' WHERE slug='fertilizers-npk-fertilizers';
UPDATE categories SET name_hi='एसएसपी / सिंगल सुपर फॉस्फेट' WHERE slug='fertilizers-ssp';
UPDATE categories SET name_hi='सूक्ष्म पोषक तत्व' WHERE slug='fertilizers-micronutrients';
UPDATE categories SET name_hi='जिंक सल्फेट' WHERE slug='fertilizers-zinc-sulphate';
UPDATE categories SET name_hi='जैव उर्वरक' WHERE slug='fertilizers-biofertilizers';
UPDATE categories SET name_hi='वर्मीकम्पोस्ट / कीचक खाद' WHERE slug='fertilizers-vermicompost';
UPDATE categories SET name_hi='गोबर खाद' WHERE slug='fertilizers-farmyard-manure';
UPDATE categories SET name_hi='कम्पोस्ट खाद' WHERE slug='fertilizers-compost';
UPDATE categories SET name_hi='नीम की खली' WHERE slug='fertilizers-neem-cake';
UPDATE categories SET name_hi='जैविक खाद' WHERE slug='fertilizers-organic-fertilizers';
UPDATE categories SET name_hi='जल-घुलनशील उर्वरक' WHERE slug='fertilizers-water-soluble-fertilizers';
UPDATE categories SET name_hi='अन्य उर्वरक' WHERE slug='fertilizers-other-fertilizers';

-- Crop Protection
UPDATE categories SET name_hi='फसल सुरक्षा' WHERE slug='crop-protection';
UPDATE categories SET name_hi='कीटनाशक' WHERE slug='crop-protection-insecticides';
UPDATE categories SET name_hi='फफूंदनाशक' WHERE slug='crop-protection-fungicides';
UPDATE categories SET name_hi='खरपतवारनाशी' WHERE slug='crop-protection-herbicides';
UPDATE categories SET name_hi='पीड़कनाशी' WHERE slug='crop-protection-pesticides';
UPDATE categories SET name_hi='जैव पीड़कनाशी' WHERE slug='crop-protection-bio-pesticides';
UPDATE categories SET name_hi='पादप वृद्धि नियामक' WHERE slug='crop-protection-plant-growth-regulators';
UPDATE categories SET name_hi='खरपतवार नियंत्रण' WHERE slug='crop-protection-weed-control';
UPDATE categories SET name_hi='कृंतकनाशी / चूहा-मार' WHERE slug='crop-protection-rodenticides';
UPDATE categories SET name_hi='सहायक द्रव्य / एडजुवेंट' WHERE slug='crop-protection-adjuvants';
UPDATE categories SET name_hi='नीम आधारित उत्पाद' WHERE slug='crop-protection-neem-based-products';
UPDATE categories SET name_hi='अन्य फसल सुरक्षा उत्पाद' WHERE slug='crop-protection-other-crop-protection';

-- Irrigation
UPDATE categories SET name_hi='सिंचाई' WHERE slug='irrigation';
UPDATE categories SET name_hi='ड्रिप सिंचाई / बूंद-बूंद सिंचाई' WHERE slug='irrigation-drip-irrigation';
UPDATE categories SET name_hi='स्प्रिंकलर सिंचाई / फव्वारा' WHERE slug='irrigation-sprinkler-irrigation';
UPDATE categories SET name_hi='रेन गन' WHERE slug='irrigation-rain-gun';
UPDATE categories SET name_hi='पानी पंप' WHERE slug='irrigation-water-pumps';
UPDATE categories SET name_hi='सबमर्सिबल पंप' WHERE slug='irrigation-submersible-pumps';
UPDATE categories SET name_hi='सोलर सिंचाई पंप' WHERE slug='irrigation-solar-irrigation-pumps';
UPDATE categories SET name_hi='पीवीसी / एचडीपीई पाइप' WHERE slug='irrigation-pvc-hdpe-pipes';
UPDATE categories SET name_hi='सिंचाई वाल्व' WHERE slug='irrigation-irrigation-valves';
UPDATE categories SET name_hi='फिल्टर' WHERE slug='irrigation-filters';
UPDATE categories SET name_hi='फर्टिगेशन प्रणाली' WHERE slug='irrigation-fertigation-systems';
UPDATE categories SET name_hi='पानी की टंकी' WHERE slug='irrigation-water-tanks';
UPDATE categories SET name_hi='अन्य सिंचाई उपकरण' WHERE slug='irrigation-other-irrigation';

-- Nursery & Plantation
UPDATE categories SET name_hi='नर्सरी व वृक्षारोपण' WHERE slug='nursery';
UPDATE categories SET name_hi='फलदार पौधे' WHERE slug='nursery-fruit-plants';
UPDATE categories SET name_hi='सब्जी के पौध' WHERE slug='nursery-vegetable-seedlings';
UPDATE categories SET name_hi='फूलों के पौधे' WHERE slug='nursery-flower-plants';
UPDATE categories SET name_hi='सजावटी पौधे' WHERE slug='nursery-ornamental-plants';
UPDATE categories SET name_hi='वानिकी पौधे' WHERE slug='nursery-forestry-plants';
UPDATE categories SET name_hi='औषधीय पौधे' WHERE slug='nursery-medicinal-plants';
UPDATE categories SET name_hi='बागानी पौध' WHERE slug='nursery-plantation-saplings';
UPDATE categories SET name_hi='पॉलीहाउस नर्सरी' WHERE slug='nursery-polyhouse-nursery';
UPDATE categories SET name_hi='ग्राफ्टेड / कलमी पौधे' WHERE slug='nursery-grafted-plants';
UPDATE categories SET name_hi='अन्य नर्सरी पौधे' WHERE slug='nursery-other-nursery-plants';

-- Medicinal & Ayurvedic Plants
UPDATE categories SET name_hi='औषधीय व आयुर्वेदिक पौधे' WHERE slug='ayurvedic-plants';
UPDATE categories SET name_hi='एलोवेरा / घृतकुमारी' WHERE slug='ayurvedic-plants-aloe-vera';
UPDATE categories SET name_hi='अश्वगंधा' WHERE slug='ayurvedic-plants-ashwagandha';
UPDATE categories SET name_hi='तुलसी' WHERE slug='ayurvedic-plants-tulsi';
UPDATE categories SET name_hi='नीम' WHERE slug='ayurvedic-plants-neem';
UPDATE categories SET name_hi='स्टेविया' WHERE slug='ayurvedic-plants-stevia';
UPDATE categories SET name_hi='गिलोय' WHERE slug='ayurvedic-plants-giloy';
UPDATE categories SET name_hi='शतावर' WHERE slug='ayurvedic-plants-shatavari';
UPDATE categories SET name_hi='ब्राह्मी' WHERE slug='ayurvedic-plants-brahmi';
UPDATE categories SET name_hi='लेमनग्रास' WHERE slug='ayurvedic-plants-lemongrass';
UPDATE categories SET name_hi='पुदीना' WHERE slug='ayurvedic-plants-mint';
UPDATE categories SET name_hi='सहजन / मोरिंगा' WHERE slug='ayurvedic-plants-moringa';
UPDATE categories SET name_hi='इसबगोल' WHERE slug='ayurvedic-plants-isabgol';
UPDATE categories SET name_hi='सेन्ना / सनाय' WHERE slug='ayurvedic-plants-senna';
UPDATE categories SET name_hi='अन्य औषधीय पौधे' WHERE slug='ayurvedic-plants-other-medicinal-plants';

-- Tractors
UPDATE categories SET name_hi='ट्रैक्टर' WHERE slug='tractors';
UPDATE categories SET name_hi='यूटिलिटी ट्रैक्टर' WHERE slug='tractors-utility-tractors';
UPDATE categories SET name_hi='कॉम्पैक्ट ट्रैक्टर' WHERE slug='tractors-compact-tractors';
UPDATE categories SET name_hi='मिनी ट्रैक्टर' WHERE slug='tractors-mini-tractors';
UPDATE categories SET name_hi='4WD ट्रैक्टर' WHERE slug='tractors-4wd-tractors';
UPDATE categories SET name_hi='2WD ट्रैक्टर' WHERE slug='tractors-2wd-tractors';
UPDATE categories SET name_hi='इलेक्ट्रिक ट्रैक्टर' WHERE slug='tractors-electric-tractors';
UPDATE categories SET name_hi='ट्रैक्टर अटैचमेंट' WHERE slug='tractors-tractor-attachments';
UPDATE categories SET name_hi='ट्रैक्टर स्पेयर पार्ट्स' WHERE slug='tractors-tractor-spare-parts';

-- Agricultural Machinery & Implements
UPDATE categories SET name_hi='कृषि मशीनरी व औज़ार' WHERE slug='agri-machinery';
UPDATE categories SET name_hi='डंपर / टिपर' WHERE slug='agri-machinery-dumper-tipper';
UPDATE categories SET name_hi='जेनरेटर सेट' WHERE slug='agri-machinery-generator-set';
UPDATE categories SET name_hi='जेसीबी / बैकहो लोडर' WHERE slug='agri-machinery-jcb-backhoe-loader';
UPDATE categories SET name_hi='लोडर' WHERE slug='agri-machinery-loader';
UPDATE categories SET name_hi='पिकअप / मिनी ट्रक' WHERE slug='agri-machinery-pickup-mini-truck';
UPDATE categories SET name_hi='पोकलेन / एक्सकेवेटर' WHERE slug='agri-machinery-poclain-excavator';
UPDATE categories SET name_hi='ट्रैक्टर ट्रॉली' WHERE slug='agri-machinery-tractor-trolley';
UPDATE categories SET name_hi='ट्रक' WHERE slug='agri-machinery-truck';
UPDATE categories SET name_hi='पानी का टैंकर' WHERE slug='agri-machinery-water-tanker';
UPDATE categories SET name_hi='रोटावेटर' WHERE slug='agri-machinery-rotavator';
UPDATE categories SET name_hi='कल्टीवेटर' WHERE slug='agri-machinery-cultivator';
UPDATE categories SET name_hi='हल' WHERE slug='agri-machinery-plough';
UPDATE categories SET name_hi='डिस्क हैरो' WHERE slug='agri-machinery-disc-harrow';
UPDATE categories SET name_hi='सीड ड्रिल / बुवाई मशीन' WHERE slug='agri-machinery-seed-drill';
UPDATE categories SET name_hi='प्लांटर / रोपाई मशीन' WHERE slug='agri-machinery-planter';
UPDATE categories SET name_hi='पावर टिलर' WHERE slug='agri-machinery-power-tiller';
UPDATE categories SET name_hi='कंबाइन हार्वेस्टर' WHERE slug='agri-machinery-combine-harvester';
UPDATE categories SET name_hi='रीपर / कटाई मशीन' WHERE slug='agri-machinery-reaper';
UPDATE categories SET name_hi='थ्रेशर / गहाई मशीन' WHERE slug='agri-machinery-thresher';
UPDATE categories SET name_hi='चाफ कटर / टूड़ी मशीन' WHERE slug='agri-machinery-chaff-cutter';
UPDATE categories SET name_hi='स्प्रेयर / छिड़काव मशीन' WHERE slug='agri-machinery-sprayer';
UPDATE categories SET name_hi='ड्रोन / कृषि ड्रोन' WHERE slug='agri-machinery-drone-agricultural-drone';
UPDATE categories SET name_hi='मोवर / घास काटने की मशीन' WHERE slug='agri-machinery-mower';
UPDATE categories SET name_hi='बेलर' WHERE slug='agri-machinery-baler';
UPDATE categories SET name_hi='कटाई-पश्चात मशीनरी' WHERE slug='agri-machinery-post-harvest-machinery';
UPDATE categories SET name_hi='अनाज सफाई मशीन' WHERE slug='agri-machinery-grain-cleaner';
UPDATE categories SET name_hi='अनाज ड्रायर' WHERE slug='agri-machinery-grain-dryer';
UPDATE categories SET name_hi='कोल्ड स्टोरेज उपकरण' WHERE slug='agri-machinery-cold-storage-equipment';
UPDATE categories SET name_hi='कृषि हस्त-औज़ार' WHERE slug='agri-machinery-farm-tools';
UPDATE categories SET name_hi='स्पेयर पार्ट्स' WHERE slug='agri-machinery-spare-parts';

-- Solar & Renewable Energy
UPDATE categories SET name_hi='सौर व नवीकरणीय ऊर्जा' WHERE slug='solar';

-- Poultry
UPDATE categories SET name_hi='पोल्ट्री' WHERE slug='poultry';
UPDATE categories SET name_hi='ब्रॉयलर मुर्गा' WHERE slug='poultry-broiler-chicken';
UPDATE categories SET name_hi='लेयर मुर्गी' WHERE slug='poultry-layer-chicken';
UPDATE categories SET name_hi='देसी मुर्गा' WHERE slug='poultry-country-chicken';
UPDATE categories SET name_hi='चूज़े' WHERE slug='poultry-chicks';
UPDATE categories SET name_hi='निर्यात/सेने के अंडे' WHERE slug='poultry-hatching-eggs';
UPDATE categories SET name_hi='टेबल अंडे' WHERE slug='poultry-table-eggs';
UPDATE categories SET name_hi='बतख' WHERE slug='poultry-duck';
UPDATE categories SET name_hi='टर्की' WHERE slug='poultry-turkey';
UPDATE categories SET name_hi='बटेर' WHERE slug='poultry-quail';
UPDATE categories SET name_hi='अन्य पोल्ट्री' WHERE slug='poultry-other-poultry';
