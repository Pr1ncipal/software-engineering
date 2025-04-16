import React from 'react';
import {
 SafeAreaView,
 Image,
 StyleSheet,
 FlatList,
 View,
 Text,
 StatusBar,
 TouchableOpacity,
 Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


const { width, height } = Dimensions.get('window');


const COLORS = { primary: '#282534', white: '#fff', blue: '#007AFF' };


const slides = [
 {
   id: '1',
   image: require('../assets/images/image1.png'),
   title: 'Encourage daily activity',
   subtitle: 'Motivate families to stay active.',
 },
 {
   id: '2',
   image: require('../assets/images/image2.png'),
   title: 'Promote healthy habits',
   subtitle: 'Support better nutrition and exercise.',
 },
 {
   id: '3',
   image: require('../assets/images/image3.png'),
   title: 'Strengthen family bonds',
   subtitle: 'Motivate families to stay active.',
 },
];


const Slide = ({ item }) => {
  return (
    <View style={{ width, height: height * 0.75, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={item?.image}
        style={{
          height: height * 0.4,   // Adjust as needed for image size
          width: width * 0.9,
          resizeMode: 'contain',
        }}
      />
      <View>
        <Text style={styles.title}>{item?.title}</Text>
        <Text style={styles.subtitle}>{item?.subtitle}</Text>
      </View>
    </View>
  );
};


const OnboardingScreen = ({ onComplete }) => {
 const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
 const ref = React.useRef();
 const updateCurrentSlideIndex = (e) => {
   const contentOffsetX = e.nativeEvent.contentOffset.x;
   const currentIndex = Math.round(contentOffsetX / width);
   setCurrentSlideIndex(currentIndex);
 };


 const goToNextSlide = () => {
   const nextSlideIndex = currentSlideIndex + 1;
   if (nextSlideIndex != slides.length) {
     const offset = nextSlideIndex * width;
     ref?.current.scrollToOffset({ offset });
     setCurrentSlideIndex(currentSlideIndex + 1);
   }
 };


 const skip = () => {
   const lastSlideIndex = slides.length - 1;
   const offset = lastSlideIndex * width;
   ref?.current.scrollToOffset({ offset });
   setCurrentSlideIndex(lastSlideIndex);
 };


 const Footer = () => {
   return (
     <View
       style={{
         height: height * 0.25,
         justifyContent: 'space-between',
         paddingHorizontal: 20,
       }}
     >
       <View
         style={{
           flexDirection: 'row',
           justifyContent: 'center',
           marginTop: 20,
         }}
       >
         {slides.map((_, index) => (
           <View
             key={index}
             style={[
               styles.indicator,
               currentSlideIndex == index && {
                 backgroundColor: COLORS.white,
                 width: 25,
               },
             ]}
           />
         ))}
       </View>
       <View style={{ marginBottom: 20 }}>
         {currentSlideIndex == slides.length - 1 ? (
           <View style={{ height: 50 }}>
             <TouchableOpacity style={styles.btn} onPress={onComplete}>
               <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
                 GET STARTED
               </Text>
             </TouchableOpacity>
           </View>
         ) : (
           <View style={{ flexDirection: 'row' }}>
             <TouchableOpacity
               activeOpacity={0.8}
               style={[
                 styles.btn,
                 {
                   borderColor: COLORS.white,
                   borderWidth: 1,
                   backgroundColor: 'transparent',
                 },
               ]}
               onPress={skip}
             >
               <Text
                 style={{
                   fontWeight: 'bold',
                   fontSize: 15,
                   color: COLORS.white,
                 }}
               >
                 SKIP
               </Text>
             </TouchableOpacity>
             <View style={{ width: 15 }} />
             <TouchableOpacity
               activeOpacity={0.8}
               onPress={goToNextSlide}
               style={styles.btn}
             >
               <Text
                 style={{
                   fontWeight: 'bold',
                   fontSize: 15,
                 }}
               >
                 NEXT
               </Text>
             </TouchableOpacity>
           </View>
         )}
       </View>
     </View>
   );
 };


 return (
   <LinearGradient colors={['#007AFF', '#B3E5FC']} style={{ flex: 1 }}>
     <StatusBar backgroundColor={COLORS.blue} />
     <FlatList
       ref={ref}
       onMomentumScrollEnd={updateCurrentSlideIndex}
       contentContainerStyle={{ flexGrow: 1 }}
       showsHorizontalScrollIndicator={false}
       horizontal
       data={slides}
       pagingEnabled
       renderItem={({ item }) => <Slide item={item} />}
     />
     <Footer />
   </LinearGradient>
 );
};


const styles = StyleSheet.create({
 subtitle: {
   color: COLORS.white,
   fontSize: 13,
   marginTop: 10,
   maxWidth: '70%',
   textAlign: 'center',
   lineHeight: 23,
 },
 title: {
   color: COLORS.white,
   fontSize: 22,
   fontWeight: 'bold',
   marginTop: 20,
   textAlign: 'center',
 },
 image: {
   height: '100%',
   width: '100%',
   resizeMode: 'contain',
 },
 indicator: {
   height: 2.5,
   width: 10,
   backgroundColor: 'grey',
   marginHorizontal: 3,
   borderRadius: 2,
 },
 btn: {
   flex: 1,
   height: 50,
   borderRadius: 5,
   backgroundColor: '#fff',
   justifyContent: 'center',
   alignItems: 'center',
 },
});


export default OnboardingScreen;


