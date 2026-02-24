 import React from "react";
 import styles from "./QuoteCallout.module.css";
 
 export default function QuoteCallout() {
   return (
     <section className={styles.section} aria-label="Tagline">
       <blockquote className={styles.pill}>
         <p className={styles.quote}>
           &quot;infrastructure-grade <span className={styles.billing}>billing</span> for Web3 SaaS&quot;
         </p>
       </blockquote>
     </section>
   );
 }
 
